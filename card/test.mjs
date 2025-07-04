import fetch from 'node-fetch';
import jose from 'node-jose';

// === CONFIGURATION ===22
const API_KEY = '6d2a582d69b6c53ebffbf888ce95cfd5:343653d4342d0bc93d8e1e916605cf96'; // <-- Replace with your full sandbox API key
const TEST_CARD_NUMBER = '4000002500001001'; // Circle test card
const TEST_CVV = '123';
const EXP_MONTH = 12;
const EXP_YEAR = 2027;
const BILLING = {
  name: 'John Doe',
  city: 'Boston',
  country: 'US',
  line1: '123 Main St',
  district: 'MA',
  postalCode: '01234'
};

// === STEP 1: Fetch Public Key and KeyId ===
async function getPublicKey() {
  const url = 'https://api-sandbox.circle.com/v1/w3s/config/entity/publicKey';
  const options = {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    }
  };
  const res = await fetch(url, options);
  const json = await res.json();
  if (!json.data || !json.data.publicKey || !json.data.keyId) {
    throw new Error('Failed to fetch public key: ' + JSON.stringify(json));
  }
  return { publicKey: json.data.publicKey, keyId: json.data.keyId };
}

// === STEP 2: Encrypt Card Data ===
async function encryptCardData(cardNumber, cvv, publicKey) {
  const key = await jose.JWK.asKey(publicKey, 'pem');
  const payload = JSON.stringify({ number: cardNumber, cvv: cvv });
  const encrypted = await jose.JWE.createEncrypt({ format: 'compact' }, key)
    .update(Buffer.from(payload))
    .final();
  return encrypted;
}

// === STEP 3: Create Card ===
async function createCard(keyId, encryptedData) {
  const url = 'https://api-sandbox.circle.com/v1/cards';
  const body = {
    idempotencyKey: 'unique-key-' + Date.now(),
    keyId,
    encryptedData,
    billingDetails: BILLING,
    expMonth: EXP_MONTH,
    expYear: EXP_YEAR
  };
  const options = {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  };
  const res = await fetch(url, options);
  const json = await res.json();
  if (!json.data || !json.data.id) {
    throw new Error('Failed to create card: ' + JSON.stringify(json));
  }
  return json.data.id;
}

// === MAIN FLOW ===
(async () => {
  try {
    console.log('Fetching public key...');
    const { publicKey, keyId } = await getPublicKey();
    console.log('Public Key:', publicKey);
    console.log('Key ID:', keyId);

    console.log('Encrypting card data...');
    const encryptedData = await encryptCardData(TEST_CARD_NUMBER, TEST_CVV, publicKey);
    console.log('Encrypted Data:', encryptedData);

    console.log('Creating card...');
    const cardId = await createCard(keyId, encryptedData);
    console.log('Your cardId:', cardId);
  } catch (err) {
    console.error('Error:', err.message);
  }
})();