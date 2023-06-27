// 导入必要的库
const bitcoin = require('bitcoinjs-lib');
const CryptoJS = require('crypto-js');
const bip39 = require('bip39');
const bip32 = require('bip32');
// const wif = require('wif');
const XLSX = require('xlsx');
const fs = require('fs');
// const ecc = require('tiny-secp256k1')
// const { BIP32Factory } = require('bip32')
// const bip32 = BIP32Factory(ecc)
// const bech32 = require('bech32');

const tinysecp = require('tiny-secp256k1');
bitcoin.initEccLib(tinysecp);

(async () => {
  // 创建一个工作簿
  var workbook = XLSX.utils.book_new();
  // 创建一个工作表
  var worksheet = XLSX.utils.json_to_sheet([]);
  // 需要改
  // 设置生成数量
  let num = 150;
  var timeFile = 'wallet-'+ new Date().toLocaleDateString().replaceAll('/','-') + '-' + new Date().getTime();

  // 设置excel表头
  const walletDetails = { 'Address': 'address', 'encryptedPrivateKey': 'encryptedPrivateKey', 'encryptedMnemonic': 'encryptedMnemonic', 'encode': 'encode' };
  XLSX.utils.sheet_add_json(worksheet, [walletDetails], { origin: -1, skipHeader: true });
  // 循环生产
  for (let i = 0; i < num; i++) {
    console.log('=========' + i + '===========')
    await init()
  }
  // 将工作表添加到工作簿
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Wallets');
  // 保存工作簿为Excel文件
  const excelFilename =  timeFile + '.xlsx';
  XLSX.writeFile(workbook, excelFilename);

  async function init() {
    // 需要改
    // 加密和解密使用的密钥
    const encryptionKey = 'shinian133'; // 自定义的密钥，请更换为你自己的安全密钥
    const path = `m/86'/0'/0'/0/0`; 
    // 生成助记词
    const mnemonic = bip39.generateMnemonic();
    // 从助记词生成种子
    const seed = await bip39.mnemonicToSeed(mnemonic);
    // 生成BIP32根密钥
    const rootKey = bip32.fromSeed(seed);
    // 从根密钥生成BIP32派生密钥
    const childNode = rootKey.derivePath(path);
    // 生成WIF格式的私钥
    const privateKey = childNode.toWIF();
    // 生成公钥
    const childNodeXOnlyPubkey = childNode.publicKey.slice(1, 33);
    // 生成地址
    const { address } = bitcoin.payments.p2tr({
      internalPubkey: childNodeXOnlyPubkey,
    });


    // 加密私钥和助记词
    const encryptedPrivateKey = CryptoJS.AES.encrypt(privateKey, encryptionKey).toString();
    const encryptedMnemonic = CryptoJS.AES.encrypt(mnemonic, encryptionKey).toString();

    // 根据地址编码
    const encode = o(new TextEncoder().encode(address));

    // 将钱包详情添加到工作表
    const walletDetails = { 'Address': address, 'encryptedPrivateKey': encryptedPrivateKey, 'encryptedMnemonic': encryptedMnemonic, 'encode': encode };
    XLSX.utils.sheet_add_json(worksheet, [walletDetails], { origin: -1, skipHeader: true });

    // 将未加密的保存到txt中
    const walletInfo = `Address: ${address}\nPrivateKey: ${privateKey}\nMnemonic: ${mnemonic}\nencode: ${encode}\n\n\n`;
    // 保存文本内容到文件
    const filename = timeFile+'.txt';
    fs.appendFile(filename, walletInfo, (err) => {
      if (err) {
      } else {
      }
    });
  }

})()

// 编码规则
var n = {
  Z: '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
}
var a = (() => {
  let e = Array(256).fill(-1);
  for (let r = 0; r < n.Z.length; ++r)
    e[n.Z.charCodeAt(r)] = r;
  return e
}
)();
var o = function (e) {
  let r = [];
  for (let t of e) {
    let e = t;
    for (let t = 0; t < r.length; ++t) {
      let o = (a[r[t]] << 8) + e;
      r[t] = n.Z.charCodeAt(o % 58),
        e = o / 58 | 0
    }
    for (; e;)
      r.push(n.Z.charCodeAt(e % 58)),
        e = e / 58 | 0
  }
  for (let t of e)
    if (t)
      break;
    else
      r.push(49);
  return r.reverse(),
    String.fromCharCode(...r)
}
