import { webcrypto } from "crypto";

// #############
// ### Utils ###
// #############

// Function to convert ArrayBuffer to Base64 string
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  return Buffer.from(buffer).toString("base64");
}

// Function to convert Base64 string to ArrayBuffer
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  var buff = Buffer.from(base64, "base64");
  return buff.buffer.slice(buff.byteOffset, buff.byteOffset + buff.byteLength);
}

// ################
// ### RSA keys ###
// ################

// Generates a pair of private / public RSA keys
type GenerateRsaKeyPair = {
  publicKey: webcrypto.CryptoKey;
  privateKey: webcrypto.CryptoKey;
};
export async function generateRsaKeyPair(): Promise<GenerateRsaKeyPair> {
  // TODO implement this function using the crypto package to generate a public and private RSA key pair.
  //      the public key should be used for encryption and the private key for decryption. Make sure the
  //      keys are extractable.
    const keys = await crypto.subtle.generateKey(
        {
          name: 'RSA-OAEP',
          modulusLength: 2048,
          publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
          hash: { name: 'SHA-256' }
        },
        true,
        ['encrypt', 'decrypt']
    );
    return {
      publicKey: keys.publicKey,
      privateKey: keys.privateKey
    };
}

// Export a crypto public key to a base64 string format
export async function exportPubKey(key: webcrypto.CryptoKey): Promise<string> {
  // TODO implement this function to return a base64 string version of a public key
    const exportedKey = await crypto.subtle.exportKey('spki', key);
    const exportedKeyBase64 = arrayBufferToBase64(exportedKey);
    return exportedKeyBase64;
}

// Export a crypto private key to a base64 string format
export async function exportPrvKey(key: webcrypto.CryptoKey | null): Promise<string | null>
{
  // TODO implement this function to return a base64 string version of a private key
  if (!key) {
    return null;
  }
  const exportedKey = await crypto.subtle.exportKey('pkcs8', key);
  const exportedKeyBase64 = arrayBufferToBase64(exportedKey);
  return exportedKeyBase64;
}

// Import a base64 string public key to its native format
export async function importPubKey(
  strKey: string
): Promise<webcrypto.CryptoKey> {
    // TODO implement this function to go back from the result of the exportPubKey function to it's native crypto key object
    const keyBuffer = base64ToArrayBuffer(strKey);
    const importedKey = await crypto.subtle.importKey('spki',keyBuffer,
        {
            name: 'RSA-OAEP',
            hash: 'SHA-256',
        },
        true,
        ['encrypt']
    );
    return importedKey;
}

// Import a base64 string private key to its native format
export async function importPrvKey(
    strKey: string
): Promise<webcrypto.CryptoKey> {
    // TODO implement this function to go back from the result of the exportPrvKey function to it's native crypto key object
    const keyBuffer = base64ToArrayBuffer(strKey);
    const importedKey = await crypto.subtle.importKey('pkcs8',keyBuffer,
        {
            name: 'RSA-OAEP',
            hash: 'SHA-256',
        },
        true,
        ['decrypt']
    );
    return importedKey;
}

// Encrypt a message using an RSA public key
export async function rsaEncrypt(
    b64Data: string,
    strPublicKey: string
): Promise<string> {
    // TODO implement this function to encrypt a base64 encoded message with a public key
    const dataBuffer = base64ToArrayBuffer(b64Data);
    const publicKey = await importPubKey(strPublicKey);
    const encryptedBuffer = await crypto.subtle.encrypt(
        {
            name: "RSA-OAEP"
        },
        publicKey,
        dataBuffer
    );
    return arrayBufferToBase64(encryptedBuffer);
}

// Decrypts a message using an RSA private key
export async function rsaDecrypt(
    data: string,
    privateKey: webcrypto.CryptoKey
): Promise<string> {
    // TODO implement this function to decrypt a base64 encoded message with a private key
    const encryptedBuffer = base64ToArrayBuffer(data);
    const decryptedBuffer = await crypto.subtle.decrypt(
        {
            name: "RSA-OAEP"
        },
        privateKey,
        encryptedBuffer
    );
    return arrayBufferToBase64(decryptedBuffer);
}


// ######################
// ### Symmetric keys ###
// ######################

// Generates a random symmetric key
export async function createRandomSymmetricKey(): Promise<webcrypto.CryptoKey> {
    const symmetricKey = await crypto.subtle.generateKey(
        {
            name: 'AES-CBC',
            length: 256
        },
        true,
        ['encrypt', 'decrypt']
    );

    return symmetricKey;
}


// Export a crypto symmetric key to a base64 string format
export async function exportSymKey(key: webcrypto.CryptoKey): Promise<string> {
  // TODO implement this function to return a base64 string version of a symmetric key
    const exportedKey = await crypto.subtle.exportKey('raw', key);
    return arrayBufferToBase64(exportedKey);
}

// Import a base64 string format to its crypto native format
export async function importSymKey(
  strKey: string
): Promise<webcrypto.CryptoKey> {
  // TODO implement this function to go back from the result of the exportSymKey function to it's native crypto key object
    const keyBuffer = base64ToArrayBuffer(strKey);
    return crypto.subtle.importKey('raw',keyBuffer,
        {
            name: 'AES-CBC',
            length: 256
        },
        true,
        ['encrypt', 'decrypt']
    );
}

// Encrypt a message using a symmetric key
export async function symEncrypt(
  key: webcrypto.CryptoKey,
  data: string
): Promise<string> {
  // TODO implement this function to encrypt a base64 encoded message with a public key
  // tip: encode the data to a uin8array with TextEncoder
    const dataUint8Array = new TextEncoder().encode(data);
    const iv = crypto.getRandomValues(new Uint8Array(16)); // Generate a random IV
    const encryptedBuffer = await crypto.subtle.encrypt({name: 'AES-CBC',iv: iv},key,dataUint8Array);
    const combinedArray = new Uint8Array(iv.length + encryptedBuffer.byteLength);
    combinedArray.set(iv);
    combinedArray.set(new Uint8Array(encryptedBuffer), iv.length);
    return arrayBufferToBase64(combinedArray);
}

// Decrypt a message using a symmetric key
export async function symDecrypt(
  strKey: string,
  encryptedData: string
): Promise<string> {
  // TODO implement this function to decrypt a base64 encoded message with a private key
  // tip: use the provided base64ToArrayBuffer function and use TextDecode to go back to a string format
    const key = await importSymKey(strKey);
    const combinedArray = base64ToArrayBuffer(encryptedData);
    const iv = combinedArray.slice(0, 16);
    const encryptedBuffer = combinedArray.slice(16);
    const decryptedBuffer = await crypto.subtle.decrypt({name: 'AES-CBC',iv: iv},key,encryptedBuffer);
    return new TextDecoder().decode(decryptedBuffer);
}
