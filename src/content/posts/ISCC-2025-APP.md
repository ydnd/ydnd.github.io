---
title: "ISCC-2025-APP"
date: "2025-05-21"
categories: CTF
tags:
- ISCC
- mobile
description: "ISCC 2025 移动安全题解，涵盖 APK 分析、加密逻辑与 Native 层分析。"
legacyPath: "/2025/05/21/ISCC-2025-APP/"
---

第一次打CTF遇到APP题当然浅浅记录一下啦，别喷我谢谢各位大哥！

仅仅记录一下过程哈，不做分析了因为真没学过

# **ISCC校赛题**

## **mobile1**

这道题就是纯粹的把apk进行分析，找到加密逻辑，解密就可以了

1.把apk进行解压，找到dex文件进行分析

2.发现加密逻辑以及加密字符串

解密脚本,不是很完善，把重复的连接部分，以及结束符'/'去掉

```
import base64

def decode_last_part(encrypted: str) -> str:
    reversed_str = encrypted[::-1]
    return ''.join(chr(ord(c) - 3) for c in reversed_str)

def decode_front_part(encrypted: str) -> str:
    decoded_bytes = base64.b64decode(encrypted)
    xored = bytes([b ^ 0x2F for b in decoded_bytes])
    # 去掉填充或不可见字符
    return ''.join(chr(c) for c in xored if 32 <= c <= 126)

# 示例密文
last_encrypted = "n33EoohsV"
front_encrypted = "fRxLWQ5BHHAA"

# 解密
last_part = decode_last_part(last_encrypted)
front_part = decode_front_part(front_encrypted)

# 合成原始字符串
original = f"{front_part}_{last_part}"

print("Front Part:", front_part)
print("Last Part:", last_part)
print("Original:", original)

```

```
ISCC{R3dv!n3_k00BllepS}
```

## **mobile2**

把apk放入jadx分析逻辑

把MainActivity str字符替换脚本的

hook脚本

```
function hook() {
    Java.perform(function () {
        console.log("Hooking started");
        let MainActivity = Java.use("com.example.mobile02.MainActivity");
        const enc = "001020001001021220000012010210002201"; // 目标对比字符串

        MainActivity["stringFromJNl"].implementation = function (key, input) {
            console.log(`MainActivity.stringFromJNl is called: key=${key}, input=${input}`);
            let result = this["stringFromJNl"](key, input);
            console.log(`MainActivity.stringFromJNl result=${result}`);

            // 初始化正确 input（如果还没找到，则用原 input）
            let correctInput = input.split(''); // 转为数组方便修改

            // 遍历 input 的每一个字符位置
            for (let pos = 0; pos < input.length; pos++) {
                console.log(`\n===== Testing position ${pos} =====`);

                // 遍历所有可打印 ASCII 字符 (32-126)
                for (let charCode = 32; charCode <= 126; charCode++) {
                    let char = String.fromCharCode(charCode);

                    // 替换 input 的第 pos 位为当前字符，其他位保持不变
                    input = correctInput.join("")
                    let modifiedInput =
                        input.substring(0, pos) +
                        char +
                        input.substring(pos + 1);

                    try {
                        let testResult = this["stringFromJNl"](key, modifiedInput);
                        // console.log(modifiedInput,testResult)
                        if (testResult === enc) {
                            console.log(modifiedInput)
                        }
                        // 检查 testResult[6*pos] 是否等于 enc[6*pos+6]
                        const testIndex = 6 * pos;
                        const encIndex = 6 * pos + 6;

                        if (testIndex < testResult.length && encIndex < enc.length) {
                            if (testResult.substring(testIndex, encIndex) === enc.substring(testIndex, encIndex)) {
                                console.log(`✅ Match at pos=${pos}, char='${char}': testResult[${testIndex}]='${testResult[testIndex]}' == enc[${encIndex}]='${enc[encIndex]}'`);
                                correctInput[pos] = char; // 记录正确的字符
                                if (pos == 5) {
                                    const finalInput = correctInput.join('');
                                    console.log(`\n🎯 Final correct input: "${finalInput}"`);
                                }
                                else {
                                    break;
                                }
                            }
                        }
                    } catch (e) {
                        console.log(`Error with char '${char}' at pos ${pos}: ${e}`);
                    }
                }
            }

            // 输出最终正确的 input
            const finalInput = correctInput.join('');
            console.log(`\n🎯 Final correct input: "${finalInput}"`);

            return result;
        };

        let Intrinsics = Java.use("kotlin.jvm.internal.Intrinsics");
        Intrinsics["areEqual"].overload('java.lang.Object', 'java.lang.Object').implementation = function (obj, obj2) {
            console.log(`Intrinsics.areEqual is called: obj=${obj}, obj2=${obj2}`);
            let result = this["areEqual"](obj, obj2);
            console.log(`Intrinsics.areEqual result=${result}`);
            return result;
        };
    });
}

setImmediate(hook);
```

![image-20250506204756662](/images/ISCC-2025-APP/image-20250506204756662.png)

# **这里记录一下frida简单使用教程**

使用frida进行hook

```
frida -U -f com.example.mobile02 -l exp.js
```

frida使用教程

```
adb push frida-server /data/local/tmp   #frida服务端上线

adb install apk #adb把apk安装到模拟器

adb root shell 

./frida-servers上线

可以使用frida-ps -U查看正在运行的app
```

回到mobile2

输入ISCC{XXXXXXXXXXXXXXXX}

![image-20250506205554830](/images/ISCC-2025-APP/image-20250506205554830.png)

ISCC{'cU2Bc'bwJ8k*9L}

## **mobile3**

### 第一部分flag

![image-20250506094529879](/images/ISCC-2025-APP/image-20250506094529879.png)

简单置换

```
import base64

# 自定义Base64编码字母表
CUSTOM_ALPHABET = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789><"
# 经过自定义Base64编码的密文
ENCRYPTED_FLAG = "svndq3TtocPLtta="
# 标准Base64编码字母表
STANDARD_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"

def translate_to_standard(s):
    result = ""
    for char in s:
        if char in CUSTOM_ALPHABET:
            index = CUSTOM_ALPHABET.index(char)
            result += STANDARD_ALPHABET[index]
    return result

def decrypt_flag(s):
    standard_encoded = translate_to_standard(s)
    # 解码前可能需要补齐等号
    padding = len(standard_encoded) % 4
    if padding:
        standard_encoded += '=' * (4 - padding)
    decoded_bytes = base64.b64decode(standard_encoded)
    return decoded_bytes.decode('utf-8')

def get_flag():
    return decrypt_flag(ENCRYPTED_FLAG)

# 调用函数并输出结果
flag = get_flag()
print("解密后的结果:", flag)
```

```
ISCC{S8*eM0
```

### 第二部分flag

#### snow隐写

Hook绕过+key

```
function main(){
 Java.perform(function(){
 var MainActivity = Java.use("com.example.mobile03.MainActivity")
 var showAd = MainActivity.showAd
 showAd.implementation = function(){
 }
 })
 var MainActivity = Java.use("com.example.mobile03.MainActivity")
 var Jformat = MainActivity.Jformat
 Jformat.implementation = function(str1, str2){
 console.log(str1, str2)
 var result = this.Jformat(str1, str2)
 console.log(result)
 return result
 }
 //715000
 }
 setImmediate(main)
```

```
frida -U -f com.example.mobile03 -l mobile3.js
```

输入ISCC{XXXXXXXXXXXX}

 key

```
524689
```

#### snow

apk解压后在lib/下有个10kb大小的文件

```
snow.exe  -C -p "524689" txt
```

得到

```
729ff2e082a5c4b209ae1e590fb88097465c779c3a17a10aebc7dd26d52fc8bfa5726bb2b0b1d80028a8aedff9c1c2874bddaff4ad9ab7ac881109e1c6e03177816525d88472e0cf452f708ea0c559edcf70297e593a162b5201c0134e2d3c04f1723381243f5587f9831df57d266489b2195a7db2aa9881feb475aa6b54d973da18bbe558e6459cf785721750b4da0a43ca4ab2c010d57f6adf5d604839b94dbb68b76b94526a22483e10b8f844979cfb79f2ac98c07e9e28dfb04c77d56877bb4c10b0a7d0a7539b8623f97cae8ff2b560bdc8e1970eae8002f040b070b235ffd61f8a53c9201af8369d0d2a43644ef907b79b08ccc426b4c0f9a576c4d70cd27fead1194bab79151f4afc7f5f5e07f101d31d3c606943139b874498d090608f11aa96433de65466a73688f5796cf595faba453fbc14925ebb77323eb9e8ae1031a227d1c9f0401650826fd52a8ce6a277f490d997e00ff89765e1dd45201e06732e60248ac0d122fc4343fce1cfd160a2c27ecbc7794b4bfaafd17b5e647755139b0fc15943327b8c4a5bb1c6b14e3b485f90faf3f8835c461c6ab7cb759f5332190b7def406518688479
```

获取私钥

```
package com.ISCC;

import com.alibaba.fastjson.util.IOUtils;
import com.github.unidbg.AndroidEmulator;
import com.github.unidbg.Module;
import com.github.unidbg.arm.backend.Unicorn2Factory;
import com.github.unidbg.debugger.Debugger;
import com.github.unidbg.linux.android.AndroidEmulatorBuilder;
import com.github.unidbg.linux.android.AndroidResolver;
import com.github.unidbg.linux.android.dvm.*;
import com.github.unidbg.memory.Memory;

import java.io.File;
import java.io.FileNotFoundException;

public class chal extends AbstractJni {
    private final AndroidEmulator emulator;
    private final VM vm;
    private final Module module;
    private final DvmClass swan, pig;
    private final boolean logging;

    chal(boolean logging) throws FileNotFoundException {
        this.logging = logging;
        emulator = AndroidEmulatorBuilder.for64Bit()
                .setProcessName("com.twogoat.114514")
                .addBackendFactory(new Unicorn2Factory(true))
                .build(); // 创建模拟器实例，要模拟32位或者64位，在这里区分
        final Memory memory = emulator.getMemory(); // 模拟器的内存操作接口
        memory.setLibraryResolver(new AndroidResolver(23)); // 设置系统类库解析
        vm = emulator.createDalvikVM(new File("\\mo3.apk")); // 创建Android虚拟机
        vm.setVerbose(logging); // 设置是否打印Jni调用细节
        vm.setJni(this);
        DalvikModule dm = vm.loadLibrary(new File("G:\\text\\new\\unidbg-0.9.8\\unidbg-0.9.8\\unidbg-android\\src\\test\\java\\com\\ISCC\\libswan.so"), false); // 加载libttEncrypt.so到unicorn虚拟内存，加载成功以后会默认调用init_array等函数
        module = dm.getModule(); // 加载好的libttEncrypt.so对应为一个模块
        Debugger attach = emulator.attach();
        attach.addBreakPoint(module.base + 0x0000000000021B04);
        dm.callJNI_OnLoad(emulator); // 手动执行JNI_OnLoad函数
        //attach.addBreakPoint(module.base + 0x24188);
        // emulator.traceCode(module.base, module.base + 0x0000000000063290).setRedirect(traceStream);
        swan = vm.resolveClass("com/example/mobile03/swan");
        pig = vm.resolveClass("pig");
    }

    public chal(AndroidEmulator emulator, VM vm, Module module, DvmClass mMainActivity, DvmClass swan, DvmClass pig, boolean logging) {
        this.emulator = emulator;
        this.vm = vm;
        this.module = module;
        this.swan = swan;
        this.pig = pig;
        this.logging = logging;
    }

    void destroy() {
        IOUtils.close(emulator);
        if (logging) {
            System.out.println("destroy");
        }
    }

    public static void main(String[] args) throws Exception {
        chal test = new chal(true);
        test.ttEncrypt();
        test.destroy();
    }

    boolean ttEncrypt() {
        String text = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
        // String res = String.valueOf(swan.callStaticJniMethodObject(emulator, "getPvKey()Ljava/lang/String;", text));
        String res = String.valueOf(swan.callStaticJniMethodObject(emulator, "getPvKey()Ljava/lang/String;", text));
        System.out.println(res); // 执行Jni方法
        return true;
    }
}
```

![屏幕截图 2025-05-06 171133](/images/ISCC-2025-APP/屏幕截图 2025-05-06 171133.png)

![image-20250506171959198](/images/ISCC-2025-APP/image-20250506171959198.png)

RSA解密

```
import binascii
from Crypto.PublicKey import RSA
from Crypto.Cipher import PKCS1_v1_5

# —— 1. 私钥 PEM —— 
PRIVATE_KEY_PEM = """-----BEGIN RSA PRIVATE KEY-----
MIIBOwIBAAJBAIKa+PyzKgc3gZWuATRVoU4MC7yt5ArqgWm1Cf5L2qFnc3vya1yP
hqS9JxQmZxHfB4DvfmR3lfRrbLrxEmrTRu8CAwEAAQJAUe6YTiazMe3PPC/5j3Q8
ifKilk3cJkDwyHiK+V1qnR+b6Srh7FTyT+yS7HZgOUlVdw9rtpEBCUya87stHNs6
cQIhAMP9EzynijUGydiu04vwz1RP8eLdY6gJwsa0CffI9QDpAiEAqpi2zS0kQv9WX
LeSILo/hdu1vWnlFotSyVSa/txfYhcCIQCtyX5CXYnXBWL8ieG6CFnAOHeTpJ6Wxb
j6O3FPT9m46QIhAKE2Z6lE+3uEqCw+HY1n9BefJQO2SpMfXkB7/2zQ/CJJAiBi00
BtWEIJak5AWXSBTQM2lRotqhV8XVfHDuT6xM688A==
-----END RSA PRIVATE KEY-----"""

# —— 2. 待解密的十六进制密文（TARGET）——
TARGET_HEX = (
    "06fd1efdf350f67f35825a92b4bf612ba33234a92dba2f47df7c80dfedc4a93a5"
    "5f4c8f3959d77cd866e6c0d7bfa2a5b63feb2a60fdc18df434f3fbeb0fa643c"
)

def main():
    # 导入私钥
    rsa_key = RSA.import_key(PRIVATE_KEY_PEM)
    cipher = PKCS1_v1_5.new(rsa_key)

    # 十六进制 → 字节
    ciphertext = binascii.unhexlify(TARGET_HEX)

    # 解密（第二个参数为 None 时，解密失败会抛出 ValueError）
    try:
        plaintext = cipher.decrypt(ciphertext, None)
    except ValueError:
        print("解密失败：可能密文或私钥不匹配")
        return

    # 输出明文
    try:
        flag = plaintext.decode('utf-8')
    except UnicodeDecodeError:
        flag = plaintext  # 若不是 UTF-8 文本，则直接打印 bytes
    print("解密得到的 flag：", flag)


if __name__ == "__main__":
    main()
```

拼接前半部分flag

# **ISCC区域赛**

## **mobile1**

1.获取db密钥

![image-20250510172205867](/images/ISCC-2025-APP/image-20250510172205867.png)

```
VlROQ2FHTnRkSE5hVVQwOQ==
```

三次base64解密后 db密钥：

```
Sparkle
```

# **这里记录一下sqlcipher简单使用教程**

使用sqlcipher-shell32.exe解密db

```
-- 查询 SQLCipher 版本
sqlite> PRAGMA cipher_version;     
3.0.1
--密钥
sqlite> PRAGMA key = 'Sparkle';
--指定兼容性
sqlite> PRAGMA cipher_compatibility = 3;
-- 执行完整性检查
sqlite> PRAGMA integrity_check;
ok
--附加一个新的、空白的“明文”数据库
sqlite> ATTACH DATABASE '66666.db' AS plaintext KEY '';
-- 导出所有数据到明文数据库
sqlite> SELECT sqlcipher_export('plaintext');
```

使用Navicat打开新db

![image-20250510183821939](/images/ISCC-2025-APP/image-20250510183821939.png)

获得密钥key

```
T0uVwXyZAbCdEfGh
```

2.hook

```
// 主 hook 函数，用于拦截关键方法
function hook() {
    Java.perform(function () {
        console.log("开始执行 hook...");
        
        // 1. 拦截 com.example.mobile01.b 类中的 c 方法
       	// 返回关键字符串
        try {
            let b = Java.use("com.example.mobile01.b");
            b["c"].implementation = function () {
                console.log("[*] 方法 com.example.mobile01.b.c() 被调用，返回固定值");
                return "T0uVwXyZAbCdEfGh";
            };
            console.log("[+] 成功 hook com.example.mobile01.b.c() 方法");
        } catch (e) {
            console.error("[-] 无法 hook com.example.mobile01.b.c():", e);
        }
        
        // 2. 拦截 DESHelper 类的 encrypt 方法，记录加密参数和结果
        try {
            let DESHelper = Java.use("com.example.mobile01.DESHelper");
            DESHelper["encrypt"].implementation = function (str, str2, str3) {
                console.log(`[*] DESHelper.encrypt 被调用: 明文=${str}, 密钥=${str2}, 向量=${str3}`);
                
                // 调用原始方法进行加密
                let result = this["encrypt"](str, str2, str3);
                
                console.log(`[*] DESHelper.encrypt 加密结果=${result}`);
                return result;
            };
            console.log("[+] 成功 hook DESHelper.encrypt() 方法");
        } catch (e) {
            console.error("[-] 无法 hook DESHelper.encrypt():", e);
        }
    });
}

// 在 JavaScript 事件循环的下一次迭代中执行 hook 函数
// 确保在 Java 环境完全初始化后再执行
setImmediate(hook);
```

![image-20250512121712561](/images/ISCC-2025-APP/image-20250512121712561.png)

ISCC{kFV+vQCmogNraCLWryVlHqbByvGfZewL}

## **mobile2**

使用 jadx分析apk文件

解密脚本：

```
def _hex_from_cipher(cipher: str) -> str:
    """A.c 的逆操作：字符 ➜ 4 位十六进制，去掉前导 '00'"""
    hex_str = ''.join(f'{ord(ch):04x}' for ch in cipher)
    return hex_str[2:] if hex_str.startswith('00') else hex_str


def _undo_padding(hex_str: str) -> str:
    """
    逆操作：去掉每 2 位后强插的 '00'（若剩余长度 %4 == 2 说明末尾少一个 '00'），
    得到插针/交换前的串 replaced
    """
    if len(hex_str) % 4 == 2:
        hex_str += '00'  # 还原被截掉的最后两个 0
    return ''.join(hex_str[i:i + 2] for i in range(0, len(hex_str), 4))


def _undo_pair_shuffle(replaced: str) -> str:
    """
    逆操作：解析 2-字节或 4-字节(…'21') 片段，复原 sb2+sb 的顺序
    """
    out, i = [], 0
    while i < len(replaced):
        # 4 字节模式：c2 c1 2 1
        if i + 3 < len(replaced) and replaced[i + 2:i + 4] == '21':
            c2, c1 = replaced[i], replaced[i + 1]
            out.extend([c1, c2])
            i += 4
        else:  # 2 字节保持原序
            out.extend(replaced[i:i + 2])
            i += 2
    return ''.join(out)


def _split_and_fix_zero(concat: str) -> str:
    """
    按 sb2 | sb 切分，再把被替换成 '3' 的零位改回 '0'。
    sb 负责偶数索引（0,2,4…），替换条件  idx==0 或 idx%3==0
    sb2 负责奇数索引（1,3,5…），替换条件  idx==1 或 (idx-1)%3==0
    """
    half = len(concat) // 2
    sb2, sb = concat[:half], concat[half:]

    # sb 复原 0 → 3
    sb = ''.join('0' if ch == '3' and (idx == 0 or idx % 3 == 0) else ch
                 for idx, ch in enumerate(sb))
    # sb2 复原 0 → 3
    sb2 = ''.join('0' if ch == '3' and (idx == 1 or (idx - 1) % 3 == 0) else ch
                  for idx, ch in enumerate(sb2))

    # 交叉还原到原 16 进制序列
    res = []
    even = odd = 0
    for idx in range(len(concat)):
        if idx % 2 == 0:  # 偶数位来自 sb
            res.append(sb[even]);
            even += 1
        else:  # 奇数位来自 sb2
            res.append(sb2[odd]);
            odd += 1
    return ''.join(res)


def _hex_to_plain(hex_str: str) -> str:
    """
    根据 A.b 的编码规则：
    - 如果以 '0' 开头则为 3 位组 (0xx) ➜ ASCII/单字节
    - 否则为 4 位组 ➜ Unicode (xxxx)
    """
    out, i = [], 0
    while i < len(hex_str):
        if hex_str[i] == '0' and i + 2 < len(hex_str):
            out.append(chr(int(hex_str[i + 1:i + 3], 16)))
            i += 3
        else:
            out.append(chr(int(hex_str[i:i + 4], 16)))
            i += 4
    return ''.join(out)


def decrypt(cipher: str) -> str:
    """顶层接口：密文 ➜ 明文"""
    step1 = _hex_from_cipher(cipher)
    step2 = _undo_padding(step1)
    step3 = _undo_pair_shuffle(step2)
    step4 = _split_and_fix_zero(step3)
    return _hex_to_plain(step4)


if __name__ == "__main__":
    # 示例：使用XOR密钥解密并展示最终结果
    xor_key = [0x53, 0x68, 0x65, 0x72, 0x6C, 0x6F, 0x63, 0x6B]  # "Sherlock"的ASCII值
    encrypted_hex = "103E50404D59575F302D50415B"  # 待解密的十六进制字符串

    # 1. 将十六进制字符串转换为字节列表
    encrypted_bytes = []
    for i in range(0, len(encrypted_hex), 2):
        encrypted_bytes.append(int(encrypted_hex[i:i + 2], 16))

    # 2. 使用XOR密钥解密
    decrypted_bytes = []
    for i in range(len(encrypted_bytes)):
        decrypted_bytes.append(encrypted_bytes[i] ^ xor_key[i % len(xor_key)])

    # 3. 转换为字符串（这是第一层加密后的密文）
    intermediate_cipher = bytes(decrypted_bytes).decode()

    # 4. 使用逆向解密函数解密最终明文
    final_plaintext = decrypt(intermediate_cipher)

    # 输出结果
    print(f"加密的十六进制: {encrypted_hex}")
    print(f"XOR解密后的密文: {intermediate_cipher}")
    print(f"最终解密的明文: {final_plaintext}")
```

![image-20250510210507472](/images/ISCC-2025-APP/image-20250510210507472.png)

![image-20250512122958047](/images/ISCC-2025-APP/image-20250512122958047.png)

ISCC{DedU%3ct}

## **mobile3**

1.hook截断获取密文

![image-20250515143114632](/images/ISCC-2025-APP/image-20250515143114632.png)

hook脚本

```
function hook() {
  Java.perform(function () {
    // 打印当前 hook 状态
    console.log("开始执行 hook...");
    
    try {
      // 查找并检查 com.example.holygrail.a 类
      let a = Java.use("com.example.holygrail.a");
      if (!a) {
        console.error("无法找到 com.example.holygrail.a 类");
        return;
      }
      console.log("成功获取 com.example.holygrail.a 类");
      
      // 查找并检查 com.example.holygrail.CipherDataHandler 类
      var targetClass = Java.use("com.example.holygrail.CipherDataHandler");
      if (!targetClass) {
        console.error("无法找到 com.example.holygrail.CipherDataHandler 类");
        return;
      }
      console.log("成功获取 com.example.holygrail.CipherDataHandler 类");
      
      // 创建参数数组
      var args = Java.array("java.lang.String", [
        "checkBox8", "checkBox6", "checkBox7", "checkBox5", 
        "checkBox12", "checkBox3", "checkBox10", "checkBox13", 
        "checkBox11", "checkBox", "checkBox9", "checkBox4", "checkBox14"
      ]);
      
      // 调用 generateCipherText 方法并处理结果
      console.log("准备调用 generateCipherText 方法...");
      try {
        var result = targetClass.generateCipherText(args);
        console.log("1. generateCipherText 结果:", result);
      } catch (e) {
        console.error("调用 generateCipherText 时出错:", e);
      }
      
      // Hook vigenereEncrypt 方法
      console.log("准备 hook vigenereEncrypt 方法...");
      if (a["vigenereEncrypt"]) {
        a["vigenereEncrypt"].implementation = function (str, str2) {
          console.log(`a.vigenereEncrypt 被调用: str=${str}, str2=${str2}`);
          
          // 使用原始实现而非递归调用，防止栈溢出
          let originalMethod = a["vigenereEncrypt"].overload("java.lang.String", "java.lang.String");
          let result = originalMethod.call(this, str, str2);
          
          console.log(`a.vigenereEncrypt 返回结果=${result}`);
          return result;
        };
        console.log("vigenereEncrypt 方法 hook 成功");
      } else {
        console.error("未找到 vigenereEncrypt 方法");
      }
      
      console.log("hook 执行完成");
      
    } catch (e) {
      console.error("执行 hook 时发生错误:", e);
    }
  });
}

// 立即执行 hook
setImmediate(hook);
```

密文：

```
1Xc``YYVX7HG;!9!;!A!
```

2.密文解密

```
import itertools
import hashlib
from tqdm import tqdm

# 可打印字符集，用于映射密文块
printable = r"0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ!#$%&'()*+,-./:;<=>?@[\]^_`{|}~"


def parse_ciphertext(ciphertext):
    """将密文解析为块列表"""
    blocks = []
    while ciphertext:
        if len(ciphertext) >= 4 and ciphertext[2:4] == "21":
            blocks.append(ciphertext[:4].lower())
            ciphertext = ciphertext[4:]
        else:
            blocks.append(ciphertext[:2].lower())
            ciphertext = ciphertext[2:]
    return blocks


def vigenere_decrypt(ciphertext, key):
    """使用Vigenere密码解密文本"""
    decrypted = []
    key = key.lower()
    key_length = len(key)
    key_index = 0

    for char in ciphertext:
        if char.isalpha():
            # 确定字符偏移
            offset = ord('a') if char.islower() else ord('A')
            k = ord(key[key_index % key_length]) - ord('a')

            # 解密公式
            decrypted_char = chr((ord(char) - offset - k) % 26 + offset)
            decrypted.append(decrypted_char)

            key_index += 1
        else:
            # 保留非字母字符
            decrypted.append(char)

    return ''.join(decrypted)

def decrypt(hex_encoded_ciphertext):
    """解密完整流程"""
    try:
        # 步骤1: 解析原始密文为块列表
        global data  # 使用全局数据映射表
        if not data:
            print("错误: 数据映射表为空")
            return None

        # 步骤2: 将输入的16进制密文转换为字节，再转为16进制字符串
        cipher_bytes = bytes.fromhex(hex_encoded_ciphertext)
        cipher_hex_str = cipher_bytes.hex()

        # 步骤3: 解析密文为块列表
        enc_blocks = parse_ciphertext(cipher_hex_str)

        # 步骤4: 使用data映射表还原字符
        decrypted_chars = []
        for block in enc_blocks:
            if block in data:
                decrypted_chars.append(printable[data.index(block)])
            else:
                print(f"警告: 块 {block} 不在数据映射表中")
                decrypted_chars.append('?')

        intermediate_text = ''.join(decrypted_chars)

        # 步骤5: 使用Vigenere密码解密
        key = "TheDaVinciCode"
        plaintext = vigenere_decrypt(intermediate_text, key)

        return plaintext

    except Exception as e:
        print(f"解密过程中发生错误: {e}")
        return None


# 预处理原始密文，生成数据映射表
def initialize_data_mapping(original_ciphertext):
    """初始化数据映射表"""
    blocks = []
    while original_ciphertext:
        if original_ciphertext[2:4] == "21":
            blocks.append(original_ciphertext[:4].lower())
            original_ciphertext = original_ciphertext[4:]
        else:
            blocks.append(original_ciphertext[:2].lower())
            original_ciphertext = original_ciphertext[2:]
    return blocks


# 主程序入口
if __name__ == "__main__":
    # 原始密文
    original_ciphertext = "39213A213B213C21402141214221432144214521464748494A4B4C505152535455565758595A5B5C60616263646550215121522153215421552156215721582159215A215B215C21303132333435363738393A3B3C272129212A212B212C2130213121322133213421352136213721382146214721482149214A214B214C2140414243444566676869"

    # 初始化数据映射表
    data = initialize_data_mapping(original_ciphertext)

    # 要解密的密文
    cipher_to_decrypt = b"1Xc``YYVX7HG;!9!;!A!".hex()

    # 执行解密
    plaintext = decrypt(cipher_to_decrypt)

    if plaintext:
        print("解密结果:", plaintext)
```

![image-20250515143436709](/images/ISCC-2025-APP/image-20250515143436709.png)

解密结果

```
VitruvianMan2025
```

ISCC{VitruvianMan2025}

# **ISCC决赛**

## **mobile1**

拖到jadx分析

在com.example.ggad b 得到二进制密文

```
0100001100110110010001000011000100110010001101100100001000110001001101100011010001000011001100110100001100110101
```

![image-20250517162054272](/images/ISCC-2025-APP/image-20250517162054272.png)

在com.example.ggad c 得到 Vigenère 密码的密文

![image-20250517162305930](/images/ISCC-2025-APP/image-20250517162305930.png)

```
0761FY4R291928
```

解密脚本

```
b = '0100001100110110010001000011000100110010001101100100001000110001001101100011010001000011001100110100001100110101'
c = '0761FY4R291928'

def vigenere_decrypt(text, key):
    decrypted_text = []
    key_index = 0

    for char in text:
        if char.isalpha():
            # Decrypt the character using Vigenère cipher
            decrypted_char = chr(((ord(char.upper()) - ord('A')) - (ord(key[key_index % len(key)].upper()) - ord('A')) + 26) % 26 + ord('A'))
            # Append decrypted char, maintaining original case
            if char.islower():
                decrypted_text.append(decrypted_char.lower())
            else:
                decrypted_text.append(decrypted_char)
            key_index += 1
        else:
            decrypted_text.append(char)

    return ''.join(decrypted_text)


def decrypt(text, key):
    return vigenere_decrypt(text, key)


def a(cs):
    # Assuming KeyManager.getKey() returns the decryption key as a string.
    key = 'ExpectoPatronum'
    return decrypt(cs, key)

c2 = a(c)

# 修复：确保二进制字符串长度是8的倍数
if len(b) % 8 != 0:
    b = b.ljust(len(b) + (8 - len(b) % 8), '0')

c1 = ''
for i in range(0, len(b), 8):
    c1 += chr(int(b[i:i + 8], 2))

# 修复：使用min函数确保不越界
length = min(len(c1), len(c2))
c_result = ''

for i in range(length):
    c_result += c1[i]
    c_result += c2[i]

# 修复：添加输入验证
if len(c_result) % 2 != 0:
    c_result = c_result[:-1]  # 截断最后一个字符使长度为偶数

try:
    byte_array = [int(c_result[i:i+2], 16) for i in range(0, len(c_result), 2)]
except ValueError:
    print("Error: Invalid hexadecimal string")
    exit(1)

c3 = ''
for i in byte_array:
    a = bin(i)[2:]
    c3 += ("{:0>8}".format(a))

str1 = c3.replace('1', 'x').replace('0', '1').replace('x', '0')

c4 = []
for i in range(0, len(str1), 8):
    # 修复：确保子串长度为8
    substr = str1[i:i + 8]
    if len(substr) < 8:
        substr = substr.ljust(8, '0')
    c4.append(int(substr, 2))

final_cipher = bytes(c4)

def rc4_ksa(key):
    """密钥调度算法 (KSA)

    得到初始置换后的S表
    """
    # 种子密钥key若为字符串，则转成字节串
    if isinstance(key, str):  
        key = key.encode()
    S = list(range(256))  # 初始化S表
    # 利用K表，对S表进行置换
    j = 0
    for i in range(256):
        j = (j + S[i] + key[i % len(key)]) % 256
        S[i], S[j] = S[j], S[i]  # 置换
    return S  


def rc4_prga(S, text):
    """伪随机生成算法 (PRGA)

    利用S产生伪随机字节流,
    将伪随机字节流与明文或密文进行异或,完成加密或解密操作
    """
    # 待处理文本text若为字符串，则转成字节串
    if isinstance(text, str):  
        text = text.encode()
    i = j = 0 
    result = []  
    for byte in text:
        i = (i + 1) % 256
        j = (j + S[i]) % 256
        S[i], S[j] = S[j], S[i]  # 置换
        t = (S[i] + S[j]) % 256
        k = S[t]  # 得到密钥字k
        # 将明文或密文与k进行异或,得到处理结果
        result.append(byte ^ k)  
    return bytes(result)

# 修复：每次使用RC4时都重新初始化S表
S = rc4_ksa('ExpectoPatronum')
res = rc4_prga(S, final_cipher)

try:
    flag = "ISCC{" + res.decode() + "}"
    print(flag)
except UnicodeDecodeError:
    print("Error: Failed to decode the result as UTF-8")
    print("Raw result:", res)
```

![image-20250517163104555](/images/ISCC-2025-APP/image-20250517163104555.png)

```
ISCC{F@n@$t!cB3@st5}
```

## **mobile2**

1.把apk进行dump操作

```
frida-dexdump -U -n mobile04
```

把dump的文件夹拉到jadx

![image-20250517171443359](/images/ISCC-2025-APP/image-20250517171443359.png)

```
68, 67, 56, 66, 67, 57, 53, 53, 52, 66, 55, 55, 54, 51, 51, 55
```

apk解压后 lib文件夹 x86.64拿到三个so

ida打开Sunday.so

在Java_com_example_mobile04_MainActivity_getEncryptedSegment 

![image-20250517173353695](/images/ISCC-2025-APP/image-20250517173353695.png)

```
PQwj5DX0ZcRW0jAIBBN6dKlt
```

![image-20250517173959858](/images/ISCC-2025-APP/image-20250517173959858.png)

得到第一部分解

```
AZNxjY
```

2.libMonday.so找到Java_com_example_mobile04_a_checkFlag2 找到异或

```
0x11
```

![image-20250517174801331](/images/ISCC-2025-APP/image-20250517174801331.png)

解密assets下X86_64

解密脚本

```
for i in range(len(data)):
    # 步骤1: 循环左移2位 (等效于原加密的右移2位)
    data[i] = (data[i] << 2) | (data[i] >> 6)
    data[i] &= 0xff  # 确保结果在0-255范围内

    # 步骤2: 异或操作的逆运算 (相同密钥再次异或即可还原)
    data[i] ^= 0x11

    # 步骤3: 循环右移3位 (等效于原加密的左移3位)
    data[i] = (data[i] >> 3) | (data[i] << 5)
    data[i] &= 0xff  # 确保结果在0-255范围内

with open("dereal", "wb") as f:
    f.write(bytes(data))  
```

![image-20250517175300463](/images/ISCC-2025-APP/image-20250517175300463.png)

ida打开dereal 在check处找到密文和key

![image-20250517180429352](/images/ISCC-2025-APP/image-20250517180429352.png)

![image-20250517181301073](/images/ISCC-2025-APP/image-20250517181301073.png)

得到第二部分

3.flag={AZNxjY50ueBWLS}
