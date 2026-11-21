import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { collection, doc, increment, onSnapshot, serverTimestamp, setDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { Save, Printer, FileDown, Share2, LayoutTemplate, FilePlus2, Lock, Eye, PencilLine, Keyboard, Mic, PenLine, FileText } from 'lucide-react';
import { db } from '../../firebase';
import { storeCollection, storeDocument } from '../../lib/storeAccess';
import { Button, Card, Field, cn } from '../ui';
import ItemsEditor from './ItemsEditor';
import VoiceBillingAssistant from './VoiceBillingAssistant';
import TemplatePicker from './TemplatePicker';
import InvoicePreview from '../invoice-templates/InvoicePreview';
import { getTemplate, ACCENTS } from '../invoice-templates';
import { calcTotals, emptyItem, nextInvoiceNumber, DOCUMENT_TYPES, documentLabel } from '../../lib/invoice';
import { formatMoney, todayISO, toNumber } from '../../lib/format';
import { isPlanBlocked } from '../../lib/plan';
import { downloadPdf, printInvoice, shareInvoice } from './exportInvoice';

const PAYMENT_MODES = ['Cash', 'UPI', 'Card', 'Credit', 'Bank Transfer', 'Cheque'];

const blankBuyer = () => ({ name: '', phone: '', address: '', gstin: '', dlNumber: '', stateName: '' });

const SAMPLE_ITEMS = [
  { ...emptyItem(), description: 'PARACETAMOL 650MG TAB', hsn: '3004', batch: 'PC2381', expiry: '08/27', mrp: 32, qty: 10, rate: 24.5, gstPercent: 12 },
  { ...emptyItem(), description: 'AZITHROMYCIN 500MG', hsn: '3004', batch: 'AZ1190', expiry: '11/26', mrp: 120, qty: 5, free: 1, rate: 86, disPercent: 5, gstPercent: 12 },
  { ...emptyItem(), description: 'ORS SACHET ORANGE', hsn: '2106', batch: 'OR774', expiry: '03/27', mrp: 22, qty: 20, rate: 16, gstPercent: 5 },
];

export default function BillingPOS({ user, userData, editBill, onOpenBill, onClearEdit, showToast, bills, inventory, customers, navigate }) {
  const general = userData?.settings?.general || {};
  const invoiceSettings = userData?.settings?.invoice || {};
  const prefix = invoiceSettings.prefix || 'INV';
  const locked = isPlanBlocked(userData);
  const role = user?.role || 'worker';
  const [savedId, setSavedId] = useState(null);
  const [showMyBills, setShowMyBills] = useState(false);
  const savedBill = bills.find((bill) => bill.id === savedId) || editBill;
  const myBills = useMemo(() => bills
    .filter((bill) => bill.createdBy === user?.uid)
    .sort((a, b) => (b.createdAt?.toMillis?.() || b.createdAt?.seconds || 0) - (a.createdAt?.toMillis?.() || a.createdAt?.seconds || 0))
    .slice(0, 10), [bills, user?.uid]);
  const canWrite = role !== 'accountant' && (!savedId || role !== 'worker' || savedBill?.createdBy === user?.uid);

  const [templateId, setTemplateId] = useState(invoiceSettings.defaultTemplate || 'pharma');
  const [accent, setAccent] = useState(invoiceSettings.accent || ACCENTS[0]);
  const [taxMode, setTaxMode] = useState('intra');
  const [invoice, setInvoice] = useState(() => ({
    invoiceNumber: nextInvoiceNumber(bills, prefix),
    date: todayISO(),
    dueDate: '',
    paymentMode: 'Cash',
    docType: 'tax-invoice',
    placeOfSupply: general.stateName || '',
    notes: '',
  }));
  const [buyer, setBuyer] = useState(blankBuyer);
  const [items, setItems] = useState(() => [emptyItem()]);
  const [extraDiscount, setExtraDiscount] = useState('');
  const [billEvents, setBillEvents] = useState([]);
  const [mobileTab, setMobileTab] = useState('edit');
  const [billingMode, setBillingMode] = useState('manual');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [busy, setBusy] = useState('');
  const paperRef = useRef(null);
  const numberTouched = useRef(false);

  useEffect(() => {
    if (!editBill) return;
    setSavedId(editBill.id);
    setTemplateId(editBill.templateName || 'pharma');
    setAccent(editBill.options?.accent || ACCENTS[0]);
    setTaxMode(editBill.options?.taxMode || 'intra');
    setExtraDiscount(editBill.options?.extraDiscount || '');
    const inv = editBill.invoiceDetails || {};
    setInvoice((prev) => ({ ...prev, ...inv, date: inv.date || inv.invoiceDate || prev.date }));
    const b = editBill.buyerDetails || {};
    setBuyer({ ...blankBuyer(), ...b, stateName: b.stateName || b.state || '' });
    setItems(editBill.items?.length ? editBill.items.map((i) => ({ ...emptyItem(), ...i, batch: i.batch || i.code || '' })) : [emptyItem()]);
    numberTouched.current = true;
  }, [editBill]);

  useEffect(() => {
    if (!savedId || !user?.storeId) {
      setBillEvents([]);
      return undefined;
    }
    return onSnapshot(collection(storeDocument(user.storeId, 'bills', savedId), 'events'), (snapshot) => {
      setBillEvents(snapshot.docs.map((document) => ({ id: document.id, ...document.data() })).sort((a, b) => (b.changedAt?.toMillis?.() || 0) - (a.changedAt?.toMillis?.() || 0)));
    }, (error) => console.error('Invoice history could not be loaded:', error));
  }, [savedId, user?.storeId]);

  useEffect(() => {
    if (savedId || numberTouched.current) return;
    setInvoice((prev) => ({ ...prev, invoiceNumber: nextInvoiceNumber(bills, prefix) }));
  }, [bills, prefix, savedId]);

  const totals = useMemo(() => calcTotals(items, { taxMode, extraDiscount }), [items, taxMode, extraDiscount]);
  const template = getTemplate(templateId);

  const docData = useMemo(() => ({
    store: general,
    buyer,
    invoice,
    items,
    totals,
    options: { accent, taxMode },
  }), [general, buyer, invoice, items, totals, accent, taxMode]);

  const sampleDoc = useMemo(() => ({
    store: { storeName: general.storeName || 'Your Medical Store', address: general.address || 'Main Market, City', phone: general.phone || '98XXXXXX10', gstin: general.gstin || '07ABCDE1234F1Z5', dlNumber: general.dlNumber || '20B/21B-1234' },
    buyer: { name: 'Sharma Medicos', address: 'Sector 12, City', phone: '98XXXXXX22', gstin: '07PQRSX5678L1Z2' },
    invoice: { invoiceNumber: `${prefix}-0001`, date: todayISO(), paymentMode: 'UPI', docType: 'tax-invoice' },
    items: SAMPLE_ITEMS,
    totals: calcTotals(SAMPLE_ITEMS),
    options: { accent, taxMode: 'intra' },
  }), [general, prefix, accent]);

  const setBuyerField = (key) => (e) => setBuyer((b) => ({ ...b, [key]: e.target.value }));
  const setInvoiceField = (key) => (e) => {
    if (key === 'invoiceNumber') numberTouched.current = true;
    setInvoice((i) => ({ ...i, [key]: e.target.value }));
  };

  const pickCustomer = (name) => {
    const match = customers.find((c) => c.name?.toLowerCase() === name.trim().toLowerCase());
    if (match) {
      setBuyer({ ...blankBuyer(), name: match.name, phone: match.phone || '', address: match.address || '', gstin: match.gstin || '', dlNumber: match.dlNumber || '', stateName: match.stateName || '' });
    }
  };

  const applyVoiceDraft = ({ buyerName, matchedItems }) => {
    if (buyerName) {
      const match = customers.find((c) => c.name?.toLowerCase() === buyerName.toLowerCase());
      setBuyer(match ? { ...blankBuyer(), ...match, name: match.name } : (current) => ({ ...current, name: buyerName }));
    }
    const preparedItems = matchedItems.map(({ item, quantity }) => ({
      ...emptyItem(),
      inventoryId: item.id,
      description: item.name || '',
      hsn: item.hsn || '',
      batch: item.batchNo && item.batchNo !== 'N/A' ? item.batchNo : '',
      expiry: item.expiryDate ? String(item.expiryDate).slice(0, 7) : '',
      mrp: item.mrp || '',
      rate: item.rate || '',
      gstPercent: item.gstPercent ?? 12,
      qty: quantity,
    }));
    setItems((current) => [...current.filter((item) => item.description || toNumber(item.rate)), ...preparedItems]);
    setBillingMode('manual');
  };

  const resetBill = useCallback(() => {
    setSavedId(null);
    numberTouched.current = false;
    setBuyer(blankBuyer());
    setItems([emptyItem()]);
    setExtraDiscount('');
    setInvoice((prev) => ({ ...prev, invoiceNumber: nextInvoiceNumber(bills, prefix), date: todayISO(), dueDate: '', notes: '' }));
    onClearEdit?.();
    setMobileTab('edit');
  }, [bills, prefix, onClearEdit]);

  const fail = (err) => {
    console.error(err);
    showToast('Sync failed: please check your connection or permissions', 'error');
  };

  const addBillEvent = (billId, action) => {
    const eventRef = doc(collection(storeDocument(user.storeId, 'bills', billId), 'events'));
    setDoc(eventRef, {
      action,
      actorUid: user.uid,
      actorEmail: user.email || '',
      actorRole: role,
      invoiceNumber: invoice.invoiceNumber,
      changedAt: serverTimestamp(),
    }).catch(fail);
  };

  const handleSave = useCallback(() => {
    if (!user || locked) return null;
    if (!canWrite) {
      showToast('This role can view invoices but cannot edit this saved bill.', 'error');
      return null;
    }
    const validItems = items.filter((i) => String(i.description).trim() && toNumber(i.qty) > 0);
    if (!validItems.length) {
      showToast('Add at least one item with quantity', 'error');
      return null;
    }
    if (bills.some((b) => b.id !== savedId && b.invoiceDetails?.invoiceNumber === invoice.invoiceNumber)) {
      showToast(`Invoice no. ${invoice.invoiceNumber} already exists`, 'error');
      return null;
    }

    const uid = user.uid;
    const buyerName = buyer.name.trim();
    let customerId = '';
    if (buyerName && buyerName.toLowerCase() !== 'cash') {
      const existing = customers.find((c) => c.name?.toLowerCase() === buyerName.toLowerCase());
      if (existing) {
        customerId = existing.id;
      } else {
        const ref = doc(storeCollection(user.storeId, 'customers'));
        customerId = ref.id;
        setDoc(ref, { ...buyer, name: buyerName, createdAt: serverTimestamp() }).catch(fail);
      }
    }

    const isCredit = invoice.paymentMode === 'Credit';
    const billPayload = {
      invoiceDetails: invoice,
      buyerDetails: { ...buyer, name: buyerName || 'Cash Customer' },
      customerId,
      items: validItems,
      totals,
      templateName: templateId,
      options: { accent, taxMode, extraDiscount: toNumber(extraDiscount) },
      paymentStatus: isCredit ? 'Unpaid' : 'Paid',
      status: 'final',
      lastEditedBy: uid,
    };

    if (savedId) {
      const existing = bills.find((b) => b.id === savedId);
      let ledgerTxnId = existing?.ledgerTxnId || '';
      if (existing?.status === 'draft' && customerId && !ledgerTxnId) {
        const txnRef = doc(storeCollection(user.storeId, 'transactions'));
        ledgerTxnId = txnRef.id;
        setDoc(txnRef, {
          customerId,
          customerName: buyerName,
          type: 'DEBIT',
          amount: totals.grandTotal,
          description: `${documentLabel(invoice.docType)} ${invoice.invoiceNumber}`,
          billId: savedId,
          date: new Date().toISOString(),
          timestamp: serverTimestamp(),
        }).catch(fail);
        if (!isCredit) {
          const paymentRef = doc(storeCollection(user.storeId, 'transactions'));
          setDoc(paymentRef, {
            customerId,
            customerName: buyerName,
            type: 'CREDIT',
            amount: totals.grandTotal,
            description: `Payment received (${invoice.paymentMode}) - ${invoice.invoiceNumber}`,
            billId: savedId,
            date: new Date().toISOString(),
            timestamp: serverTimestamp(),
          }).catch(fail);
        }
      }
      updateDoc(storeDocument(user.storeId, 'bills', savedId), {
        ...billPayload,
        ...(existing?.status === 'draft' ? { createdBy: existing.createdBy || uid, ledgerTxnId } : {}),
        updatedAt: serverTimestamp(),
      }).catch(fail);
      if (existing?.ledgerTxnId) {
        updateDoc(storeDocument(user.storeId, 'transactions', existing.ledgerTxnId), { amount: totals.grandTotal, customerId, customerName: buyerName }).catch(fail);
      }
      if (existing?.status === 'draft' && !['estimate', 'proforma'].includes(invoice.docType)) {
        validItems.forEach((item) => {
          const inv = inventory.find((entry) => entry.id === item.inventoryId) || inventory.find((entry) => entry.name === item.description);
          if (inv) updateDoc(storeDocument(user.storeId, 'inventory', inv.id), { qty: increment(-(toNumber(item.qty) + toNumber(item.free))) }).catch(fail);
        });
      }
      addBillEvent(savedId, existing?.status === 'draft' ? 'draft_finalized' : 'updated');
      showToast('Invoice updated');
      return savedId;
    }

    const billRef = doc(storeCollection(user.storeId, 'bills'));
    let ledgerTxnId = '';
    if (customerId) {
      const txnRef = doc(storeCollection(user.storeId, 'transactions'));
      ledgerTxnId = txnRef.id;
      setDoc(txnRef, {
        customerId,
        customerName: buyerName,
        type: 'DEBIT',
        amount: totals.grandTotal,
        description: `${documentLabel(invoice.docType)} ${invoice.invoiceNumber}`,
        billId: billRef.id,
        date: new Date().toISOString(),
        timestamp: serverTimestamp(),
      }).catch(fail);
      if (!isCredit) {
        setDoc(doc(storeCollection(user.storeId, 'transactions')), {
          customerId,
          customerName: buyerName,
          type: 'CREDIT',
          amount: totals.grandTotal,
          description: `Payment received (${invoice.paymentMode}) - ${invoice.invoiceNumber}`,
          billId: billRef.id,
          date: new Date().toISOString(),
          timestamp: serverTimestamp(),
        }).catch(fail);
      }
    }
    setDoc(billRef, { ...billPayload, ledgerTxnId, createdBy: uid, createdAt: serverTimestamp() }).catch(fail);
    addBillEvent(billRef.id, 'created');

    const deductsStock = !['estimate', 'proforma'].includes(invoice.docType);
    if (deductsStock) {
      validItems.forEach((item) => {
        const inv = inventory.find((i) => i.id === item.inventoryId) || inventory.find((i) => i.name === item.description);
        if (inv) {
          const qty = toNumber(item.qty) + toNumber(item.free);
          updateDoc(storeDocument(user.storeId, 'inventory', inv.id), { qty: increment(-qty) }).catch(fail);
        }
      });
    }

    setSavedId(billRef.id);
    showToast(navigator.onLine ? 'Invoice saved' : 'Saved offline. Will sync when online');
    return billRef.id;
  }, [user, locked, canWrite, items, bills, savedId, invoice, buyer, customers, totals, templateId, accent, taxMode, extraDiscount, inventory, showToast, addBillEvent]);

  const handleSaveDraft = async () => {
    if (!user || locked || !canWrite) return;
    const validItems = items.filter((item) => String(item.description).trim() && toNumber(item.qty) > 0);
    if (!validItems.length) {
      showToast('Add at least one item before saving a draft', 'error');
      return;
    }
    if (bills.some((bill) => bill.id !== savedId && bill.invoiceDetails?.invoiceNumber === invoice.invoiceNumber)) {
      showToast(`Invoice no. ${invoice.invoiceNumber} already exists`, 'error');
      return;
    }

    const billRef = savedId ? storeDocument(user.storeId, 'bills', savedId) : doc(storeCollection(user.storeId, 'bills'));
    const eventRef = doc(collection(billRef, 'events'));
    const buyerName = buyer.name.trim();
    const customerId = customers.find((customer) => customer.name?.toLowerCase() === buyerName.toLowerCase())?.id || '';
    const draftData = {
      invoiceDetails: invoice,
      buyerDetails: { ...buyer, name: buyerName || 'Cash Customer' },
      customerId,
      items: validItems,
      totals,
      templateName: templateId,
      options: { accent, taxMode, extraDiscount: toNumber(extraDiscount) },
      paymentStatus: invoice.paymentMode === 'Credit' ? 'Unpaid' : 'Paid',
      status: 'draft',
      createdBy: savedBill?.createdBy || user.uid,
      lastEditedBy: user.uid,
      updatedAt: serverTimestamp(),
    };
    if (!savedId) draftData.createdAt = serverTimestamp();

    try {
      const batch = writeBatch(db);
      batch.set(billRef, draftData, { merge: true });
      batch.set(eventRef, {
        action: savedId ? 'draft_updated' : 'draft_saved',
        actorUid: user.uid,
        actorEmail: user.email || '',
        actorRole: role,
        invoiceNumber: invoice.invoiceNumber,
        changedAt: serverTimestamp(),
      });
      await batch.commit();
      setSavedId(billRef.id);
      showToast('Draft saved. Stock and ledgers were not changed.');
    } catch (error) {
      fail(error);
    }
  };

  const fileName = `${invoice.invoiceNumber}-${(buyer.name || 'cash').replace(/\W+/g, '_')}`;

  const handlePrint = useCallback(() => {
    setMobileTab('preview');
    requestAnimationFrame(() => printInvoice(template.paper));
  }, [template.paper]);

  const handlePdf = async () => {
    if (!paperRef.current) return;
    setBusy('pdf');
    try {
      await downloadPdf(paperRef.current, fileName);
    } catch (e) {
      console.error(e);
      showToast('Could not generate PDF', 'error');
    }
    setBusy('');
  };

  const handleShare = async () => {
    if (!paperRef.current) return;
    setBusy('share');
    const text = `${documentLabel(invoice.docType)} ${invoice.invoiceNumber} from ${general.storeName || 'our store'}\nAmount: ${formatMoney(totals.grandTotal)}\nDate: ${invoice.date}\nThank you for your business!`;
    await shareInvoice(paperRef.current, fileName, { phone: buyer.phone, text });
    setBusy('');
  };

  const latest = useRef({});
  latest.current = { handleSave, handlePrint, resetBill };
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'F2') { e.preventDefault(); latest.current.handleSave(); }
      if (e.key === 'F4') { e.preventDefault(); latest.current.handlePrint(); }
      if (e.key === 'F9') { e.preventDefault(); latest.current.resetBill(); }
      if (e.key === 'F3') { e.preventDefault(); document.getElementById('product-search')?.focus(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (locked) {
    return (
      <Card className="max-w-lg mx-auto text-center py-12">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-red-500/10 text-red-400 flex items-center justify-center mb-4"><Lock /></div>
        <h2 className="text-xl font-bold text-white">Billing is locked</h2>
        <p className="text-slate-400 text-sm mt-2">Your plan has expired or the account is suspended. {role === 'owner' ? 'Renew to continue creating invoices.' : 'Ask the store owner to renew the plan.'}</p>
        {role === 'owner' && <Button className="mt-6" onClick={() => navigate('plans')}>View Plans</Button>}
      </Card>
    );
  }

  return (
    <div className="pb-24 lg:pb-0">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4 no-print">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
            {savedId ? 'Edit Invoice' : 'New Invoice'}
            <span className="text-xs font-semibold text-slate-400 border border-white/10 rounded-md px-2 py-0.5">{invoice.invoiceNumber}</span>
          </h1>
          <p className="hidden md:flex items-center gap-1.5 text-xs text-slate-500 mt-1">
            <Keyboard size={13} /> F2 Save · F3 Search · F4 Print · F9 New
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {role === 'worker' && <Button variant="secondary" onClick={() => setShowMyBills((isOpen) => !isOpen)} aria-expanded={showMyBills}>
            <FileText size={16} /> My bills ({myBills.length})
          </Button>}
          <Button variant="secondary" onClick={() => setPickerOpen(true)}><LayoutTemplate size={16} /> {template.name}</Button>
          <Button variant="secondary" onClick={resetBill}><FilePlus2 size={16} /> New</Button>
          {canWrite && <Button variant="secondary" onClick={handleSaveDraft} disabled={Boolean(savedId && savedBill?.status !== 'draft')}><Save size={16} /> Save draft</Button>}
          {canWrite && <Button onClick={handleSave}><Save size={16} /> {savedId ? 'Complete / Update' : 'Complete sale'}</Button>}
        </div>
      </div>

      {role === 'worker' && showMyBills && <Card className="mb-4 p-4">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div>
            <h2 className="text-sm font-semibold text-white">Your recent bills</h2>
            <p className="text-xs text-slate-400 mt-1">You can reopen and edit bills created by your account.</p>
          </div>
          <Button variant="secondary" onClick={() => setShowMyBills(false)}>Close</Button>
        </div>
        {myBills.length ? <ul className="divide-y divide-white/10">
          {myBills.map((bill) => <li key={bill.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">{bill.invoiceDetails?.invoiceNumber || 'Invoice'} · {bill.buyerDetails?.name || 'Cash Customer'}</p>
              <p className="text-xs text-slate-400 mt-1">{formatMoney(bill.totals?.grandTotal || 0)} · {bill.status === 'draft' ? 'Draft' : 'Saved'}</p>
            </div>
            <Button variant="secondary" onClick={() => { onOpenBill?.(bill); setShowMyBills(false); }}>
              <PencilLine size={15} /> Edit bill
            </Button>
          </li>)}
        </ul> : <p className="text-sm text-slate-400 py-3">No bills created by your account yet.</p>}
      </Card>}

      {savedId && billEvents.length > 0 && <details className="mb-4 rounded-xl border border-white/10 bg-ink-900/60 px-4 py-3">
        <summary className="cursor-pointer text-sm font-semibold text-slate-200">Invoice change history <span className="text-slate-500">({billEvents.length})</span></summary>
        <ol className="mt-3 space-y-2 border-l border-white/10 pl-4">
          {billEvents.map((event) => <li key={event.id} className="text-xs text-slate-400">
            <span className="font-semibold text-white">{String(event.action || 'updated').replaceAll('_', ' ')}</span>
            <span> by {event.actorEmail || 'team member'}</span>
            <span className="ml-2 text-slate-500">{event.changedAt?.toDate?.().toLocaleString('en-IN') || 'Just now'}</span>
          </li>)}
        </ol>
      </details>}

      <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-ink-900 border border-white/10 mb-4 no-print" role="group" aria-label="Billing method">
        {[['manual', 'Type a bill', PenLine], ['voice', 'Speak a bill', Mic]].map(([id, label, Icon]) => (
          <button key={id} type="button" aria-pressed={billingMode === id} onClick={() => setBillingMode(id)}
            className={cn('flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition', billingMode === id ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white')}>
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      {billingMode === 'voice' && <div className="mb-4 no-print"><VoiceBillingAssistant inventory={inventory} onApply={applyVoiceDraft} /></div>}

      <div className="lg:hidden grid grid-cols-2 gap-1 p-1 rounded-xl bg-ink-900 border border-white/10 mb-4 no-print" role="tablist">
        {[['edit', 'Edit', PencilLine], ['preview', 'Preview', Eye]].map(([id, label, Icon]) => (
          <button key={id} role="tab" aria-selected={mobileTab === id} onClick={() => setMobileTab(id)}
            className={cn('flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold', mobileTab === id ? 'bg-white/10 text-white' : 'text-slate-400')}>
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] gap-5 items-start">
        <fieldset disabled={!canWrite} aria-label="Invoice editor" className={cn('min-w-0 space-y-4 no-print', mobileTab !== 'edit' && 'hidden lg:block')}>
          <Card className="p-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Field as="select" label="Document" value={invoice.docType} onChange={setInvoiceField('docType')} className="col-span-2 sm:col-span-1">
                {DOCUMENT_TYPES.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
              </Field>
              <Field label="Number" value={invoice.invoiceNumber} onChange={setInvoiceField('invoiceNumber')} />
              <Field label="Date" type="date" value={invoice.date} onChange={setInvoiceField('date')} />
              <Field as="select" label="Tax Type" value={taxMode} onChange={(e) => setTaxMode(e.target.value)} className="col-span-2 sm:col-span-1">
                <option value="intra">CGST + SGST</option>
                <option value="inter">IGST (Inter-state)</option>
              </Field>
            </div>
          </Card>

          <Card className="p-4">
            <h2 className="text-sm font-semibold text-white mb-3">Customer / Party</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 sm:col-span-1">
                <label htmlFor="buyer-name" className="field-label">Name</label>
                <input id="buyer-name" list="customer-list" className="field" value={buyer.name} placeholder="Cash Customer"
                  onChange={(e) => { setBuyerField('name')(e); pickCustomer(e.target.value); }} autoComplete="off" />
                <datalist id="customer-list">
                  {customers.map((c) => <option key={c.id} value={c.name} />)}
                </datalist>
              </div>
              <Field label="Mobile" type="tel" inputMode="tel" value={buyer.phone} onChange={setBuyerField('phone')} className="col-span-2 sm:col-span-1" />
              <Field label="Address" value={buyer.address} onChange={setBuyerField('address')} className="col-span-2" />
              <Field label="GSTIN" value={buyer.gstin} onChange={(e) => setBuyer((b) => ({ ...b, gstin: e.target.value.toUpperCase() }))} />
              <Field label="D.L. No" value={buyer.dlNumber} onChange={setBuyerField('dlNumber')} />
            </div>
          </Card>

          <Card className="p-4">
            <h2 className="text-sm font-semibold text-white mb-3">Items</h2>
            <ItemsEditor items={items} setItems={setItems} inventory={inventory} />
          </Card>

          <Card className="p-4">
            <div className="grid grid-cols-2 gap-3">
              <Field as="select" label="Payment Mode" value={invoice.paymentMode} onChange={setInvoiceField('paymentMode')}>
                {PAYMENT_MODES.map((m) => <option key={m}>{m}</option>)}
              </Field>
              <Field label="Extra Discount (₹)" type="number" inputMode="decimal" min="0" value={extraDiscount} onChange={(e) => setExtraDiscount(e.target.value)} />
              <Field label="Due Date" type="date" value={invoice.dueDate} onChange={setInvoiceField('dueDate')} />
              <Field label="Place of Supply" value={invoice.placeOfSupply} onChange={setInvoiceField('placeOfSupply')} />
              <Field as="textarea" rows={2} label="Notes" value={invoice.notes} onChange={setInvoiceField('notes')} className="col-span-2" />
            </div>
            <dl className="mt-4 pt-4 border-t border-white/10 grid grid-cols-2 gap-y-1.5 text-sm">
              <dt className="text-slate-400">Taxable</dt><dd className="text-right tabular">{formatMoney(totals.taxableValue)}</dd>
              <dt className="text-slate-400">GST</dt><dd className="text-right tabular">{formatMoney(totals.gstTotal)}</dd>
              <dt className="text-white font-bold text-base">Grand Total</dt><dd className="text-right font-extrabold text-base text-brand-green tabular">{formatMoney(totals.grandTotal)}</dd>
            </dl>
          </Card>
        </fieldset>

        <div className={cn('lg:sticky lg:top-20', mobileTab !== 'preview' && 'hidden lg:block')}>
          <div className="flex flex-wrap gap-2 mb-3 no-print">
            <Button variant="secondary" onClick={handlePrint}><Printer size={16} /> Print</Button>
            <Button variant="secondary" onClick={handlePdf} disabled={busy === 'pdf'}><FileDown size={16} /> {busy === 'pdf' ? 'Preparing...' : 'PDF'}</Button>
            <Button variant="secondary" onClick={handleShare} disabled={busy === 'share'}><Share2 size={16} /> {busy === 'share' ? 'Preparing...' : 'Share'}</Button>
          </div>
          <div className="rounded-2xl bg-slate-300/90 p-3 sm:p-5 lg:max-h-[calc(100vh-9rem)] lg:overflow-y-auto">
            <InvoicePreview ref={paperRef} doc={docData} templateId={templateId} />
          </div>
        </div>
      </div>

      {canWrite && <div className="lg:hidden fixed bottom-16 inset-x-0 z-30 px-4 pb-2 no-print">
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-ink-850/95 backdrop-blur border border-white/10 px-4 py-3 shadow-2xl">
          <div>
            <div className="text-[10px] uppercase text-slate-400">Total</div>
            <div className="text-lg font-extrabold text-white tabular">{formatMoney(totals.grandTotal)}</div>
          </div>
          <Button onClick={handleSave}><Save size={16} /> {savedId ? 'Complete / Update' : 'Complete sale'}</Button>
        </div>
      </div>}

      <TemplatePicker isOpen={pickerOpen} onClose={() => setPickerOpen(false)} value={templateId} onChange={setTemplateId}
        accent={accent} onAccentChange={setAccent} sampleDoc={sampleDoc} />
    </div>
  );
}
