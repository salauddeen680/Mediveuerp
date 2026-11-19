const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { setGlobalOptions } = require('firebase-functions/v2');
const { defineSecret } = require('firebase-functions/params');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, Timestamp, FieldValue } = require('firebase-admin/firestore');
const Razorpay = require('razorpay');
const crypto = require('node:crypto');

initializeApp();
setGlobalOptions({ region: 'asia-south1', maxInstances: 10 });

const razorpayKeyId = defineSecret('RAZORPAY_KEY_ID');
const razorpayKeySecret = defineSecret('RAZORPAY_KEY_SECRET');
const plans = {
  monthly: { name: 'Monthly Plan (₹249)', amount: 24900, days: 30 },
  yearly: { name: 'Yearly Plan (₹2799)', amount: 279900, days: 365 },
};

function razorpayClient() {
  return new Razorpay({ key_id: razorpayKeyId.value(), key_secret: razorpayKeySecret.value() });
}

function millis(value) {
  if (value?.toMillis) return value.toMillis();
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return Date.parse(value) || 0;
  return 0;
}

function safeEqualHex(left, right) {
  if (!/^[a-f\d]{64}$/i.test(left || '') || !/^[a-f\d]{64}$/i.test(right || '')) return false;
  return crypto.timingSafeEqual(Buffer.from(left, 'hex'), Buffer.from(right, 'hex'));
}

exports.attachReferral = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in to attach a referral.');
  const uid = request.auth.uid;
  const referrerUid = String(request.data?.referrerUid || '').trim();
  if (!referrerUid || referrerUid === uid || !/^[A-Za-z0-9_-]{20,128}$/.test(referrerUid)) {
    throw new HttpsError('invalid-argument', 'This referral link is invalid.');
  }

  const db = getFirestore();
  const userRef = db.doc(`users/${uid}`);
  const referrerRef = db.doc(`users/${referrerUid}`);
  const referralRef = db.doc(`referrals/${referrerUid}__${uid}`);
  await db.runTransaction(async (transaction) => {
    const [userSnap, referrerSnap, referralSnap] = await Promise.all([
      transaction.get(userRef), transaction.get(referrerRef), transaction.get(referralRef),
    ]);
    if (!referrerSnap.exists || !userSnap.exists) throw new HttpsError('not-found', 'The account for this referral could not be found.');
    const userData = userSnap.data();
    if (userData.referredBy) {
      if (userData.referredBy === referrerUid) return;
      throw new HttpsError('failed-precondition', 'A referral is already linked to this account.');
    }
    if (userData.hasPaidSubscription || userData.razorpayPaymentId) {
      throw new HttpsError('failed-precondition', 'A referral can only be attached before the first paid subscription.');
    }
    if (!referralSnap.exists) {
      transaction.set(userRef, { referredBy: referrerUid, referralLinkedAt: FieldValue.serverTimestamp() }, { merge: true });
      transaction.set(referralRef, {
        referrerUid,
        referredUserId: uid,
        status: 'pending',
        linkedAt: FieldValue.serverTimestamp(),
        rewardEligible: false,
      });
    }
  });
  return { linked: true };
});

exports.getReferralDashboard = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in to view referral rewards.');
  const uid = request.auth.uid;
  const db = getFirestore();
  const [statsSnap, referralsSnap] = await Promise.all([
    db.doc(`referralStats/${uid}`).get(),
    db.collection('referrals').where('referrerUid', '==', uid).limit(100).get(),
  ]);
  const now = Date.now();
  const referredUsers = referralsSnap.docs.length
    ? await db.getAll(...referralsSnap.docs.map((entry) => db.doc(`users/${entry.get('referredUserId')}`)))
    : [];
  const referrals = referralsSnap.docs.map((entry, index) => {
    const data = entry.data();
    const referredUser = referredUsers[index]?.exists ? referredUsers[index].data() : {};
    const currentPlan = String(referredUser.plan || '');
    const activeMonthlySubscriptionEndsAt = millis(referredUser.subscriptionEndsAt);
    const isActiveMonthly = data.status === 'qualified'
      && referredUser.status === 'Active'
      && referredUser.hasPaidSubscription === true
      && /month|249/i.test(currentPlan)
      && activeMonthlySubscriptionEndsAt > now;
    return {
      id: data.referredUserId,
      status: data.status,
      qualifiedAt: data.qualifiedAt?.toMillis?.() || null,
      isActiveMonthly,
      activeMonthlySubscriptionEndsAt: activeMonthlySubscriptionEndsAt || null,
    };
  });
  const storedStats = statsSnap.exists ? statsSnap.data() : {};
  const activeMonthlySubscribers = referrals.filter((referral) => referral.isActiveMonthly).length;
  return {
    stats: { ...storedStats, activeMonthlySubscribers, rewardGranted: Boolean(storedStats.rewardGranted) },
    referrals,
  };
});

exports.createSubscriptionOrder = onCall({ secrets: [razorpayKeyId, razorpayKeySecret] }, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in before purchasing a plan.');
  const planId = String(request.data?.planId || '');
  const plan = plans[planId];
  if (!plan) throw new HttpsError('invalid-argument', 'Choose a valid subscription plan.');

  const userSnap = await getFirestore().doc(`users/${request.auth.uid}`).get();
  if (!userSnap.exists) throw new HttpsError('failed-precondition', 'Your store profile is not ready.');
  const referrerUid = String(userSnap.get('referredBy') || '');
  const order = await razorpayClient().orders.create({
    amount: plan.amount,
    currency: 'INR',
    receipt: `mediveu_${request.auth.uid.slice(0, 12)}_${Date.now()}`,
    notes: { userId: request.auth.uid, planId, referrerUid },
  });
  return { id: order.id, amount: order.amount, currency: order.currency, keyId: razorpayKeyId.value() };
});

exports.confirmSubscriptionPayment = onCall({ secrets: [razorpayKeyId, razorpayKeySecret] }, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in to verify this payment.');
  const { orderId, paymentId, signature } = request.data || {};
  if (![orderId, paymentId, signature].every((value) => typeof value === 'string' && value.length > 0)) {
    throw new HttpsError('invalid-argument', 'Payment confirmation details are incomplete.');
  }

  const expectedSignature = crypto.createHmac('sha256', razorpayKeySecret.value()).update(`${orderId}|${paymentId}`).digest('hex');
  if (!safeEqualHex(signature, expectedSignature)) throw new HttpsError('permission-denied', 'The payment signature could not be verified.');

  const razorpay = razorpayClient();
  let order;
  let payment;
  try {
    [order, payment] = await Promise.all([razorpay.orders.fetch(orderId), razorpay.payments.fetch(paymentId)]);
    if (payment.status === 'authorized') payment = await razorpay.payments.capture(paymentId, payment.amount, payment.currency);
  } catch {
    throw new HttpsError('not-found', 'The payment could not be confirmed with Razorpay.');
  }
  const uid = request.auth.uid;
  const planId = String(order.notes?.planId || '');
  const plan = plans[planId];
  if (!plan || order.notes?.userId !== uid || order.amount !== plan.amount || payment.order_id !== orderId || payment.amount !== plan.amount || payment.currency !== 'INR' || payment.status !== 'captured') {
    throw new HttpsError('failed-precondition', 'The captured payment does not match this account and subscription plan.');
  }

  const db = getFirestore();
  const userRef = db.doc(`users/${uid}`);
  const paymentRef = db.doc(`users/${uid}/payments/${orderId}`);
  const referrerUid = String(order.notes?.referrerUid || '');
  const referralRef = referrerUid ? db.doc(`referrals/${referrerUid}__${uid}`) : null;
  const statsRef = referrerUid ? db.doc(`referralStats/${referrerUid}`) : null;
  const referrerRef = referrerUid ? db.doc(`users/${referrerUid}`) : null;
  const now = Date.now();

  const result = await db.runTransaction(async (transaction) => {
    const [paymentSnap, userSnap, referralSnap, statsSnap, referrerSnap] = await Promise.all([
      transaction.get(paymentRef), transaction.get(userRef),
      referralRef ? transaction.get(referralRef) : Promise.resolve(null),
      statsRef ? transaction.get(statsRef) : Promise.resolve(null),
      referrerRef ? transaction.get(referrerRef) : Promise.resolve(null),
    ]);
    if (paymentSnap.exists) return { alreadyProcessed: true, referralReward: false };
    if (!userSnap.exists) throw new HttpsError('not-found', 'Store account not found.');

    const userData = userSnap.data();
    const previousEnd = millis(userData.subscriptionEndsAt);
    const previousStart = millis(userData.createdAt);
    const existingDays = /year|2799/i.test(userData.plan || '') ? 365 : /month|249/i.test(userData.plan || '') ? 30 : 0;
    const currentEnd = previousEnd || (existingDays && previousStart ? previousStart + existingDays * 86400000 : 0);
    const subscriptionEndsAt = Math.max(now, currentEnd) + plan.days * 86400000;
    transaction.set(paymentRef, {
      razorpayPaymentId: paymentId,
      planId,
      amount: plan.amount,
      status: 'captured',
      verifiedAt: FieldValue.serverTimestamp(),
    });
    transaction.set(userRef, {
      plan: plan.name,
      status: 'Active',
      createdAt: currentEnd > now ? userData.createdAt : now,
      subscriptionEndsAt: Timestamp.fromMillis(subscriptionEndsAt),
      hasPaidSubscription: true,
      razorpayPaymentId: paymentId,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    let referralReward = false;
    const isLinkedReferral = referralRef && referralSnap?.exists
      && userData.referredBy === referrerUid
      && referralSnap.get('referrerUid') === referrerUid
      && referralSnap.get('referredUserId') === uid;
    if (isLinkedReferral) {
      const referralUpdate = {
        activeMonthlySubscriptionEndsAt: planId === 'monthly' ? Timestamp.fromMillis(subscriptionEndsAt) : null,
        currentPlanId: planId,
        updatedAt: FieldValue.serverTimestamp(),
      };
      if (referralSnap.get('status') === 'pending' && planId === 'monthly' && referrerSnap?.exists) {
        const qualifiedCount = Number(statsSnap?.get('qualifiedMonthly') || 0) + 1;
        const rewardAlreadyGranted = Boolean(statsSnap?.get('rewardGranted'));
        const shouldGrantReward = qualifiedCount === 3 && !rewardAlreadyGranted;
        referralUpdate.status = 'qualified';
        referralUpdate.rewardEligible = shouldGrantReward;
        referralUpdate.qualifyingOrderId = orderId;
        referralUpdate.qualifyingPaymentId = paymentId;
        referralUpdate.qualifiedAt = FieldValue.serverTimestamp();
        transaction.set(statsRef, {
          qualifiedMonthly: qualifiedCount,
          rewardMonthsEarned: shouldGrantReward ? 1 : Number(statsSnap?.get('rewardMonthsEarned') || 0),
          rewardMonthsApplied: Number(statsSnap?.get('rewardMonthsApplied') || 0) + (shouldGrantReward ? 1 : 0),
          rewardGranted: rewardAlreadyGranted || shouldGrantReward,
          updatedAt: FieldValue.serverTimestamp(),
        }, { merge: true });
        if (shouldGrantReward) {
          const referrerData = referrerSnap.data();
          const referrerEnd = millis(referrerData.subscriptionEndsAt);
          const referrerStart = millis(referrerData.createdAt);
          const referrerDays = /year|2799/i.test(referrerData.plan || '') ? 365 : /month|249/i.test(referrerData.plan || '') ? 30 : 0;
          const currentReferrerEnd = referrerEnd || (referrerDays && referrerStart ? referrerStart + referrerDays * 86400000 : 0);
          const rewardStart = Math.max(now, currentReferrerEnd);
          const rewardEnd = rewardStart + 30 * 86400000;
          transaction.set(referrerRef, {
            plan: referrerData.plan && referrerData.plan !== '7 Days Free Trial' ? referrerData.plan : plans.monthly.name,
            status: 'Active',
            createdAt: currentReferrerEnd > now ? referrerData.createdAt : rewardStart,
            subscriptionEndsAt: Timestamp.fromMillis(rewardEnd),
            updatedAt: FieldValue.serverTimestamp(),
          }, { merge: true });
          referralReward = true;
        }
      }
      transaction.set(referralRef, referralUpdate, { merge: true });
    }
    return { alreadyProcessed: false, referralReward };
  });
  return { verified: true, ...result };
});
