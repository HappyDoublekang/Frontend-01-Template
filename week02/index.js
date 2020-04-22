// 一、写一个正则表达式 匹配所有 Number 直接量
var reg = new Regex("[+-]?\d+(\.\d*)?|[+-]?\.\d+")

// [+-]?    匹配正负号

// \d+  匹配数字

// (\.\d*)?    匹配小数点和数字组合

// 不能匹配 .xxx 这种格式的数字,因此增加后一部分

// |  逻辑符号 或者

// [+-]?\.\d+



// 二、写一个 UTF-8 Encoding 的函数

// 简介：（查资料得出）

// javascript的字符集：
// javascript程序是使用Unicode字符集编写的。Unicode是ASCII和Latin-1的超集，并支持地球上几乎所有的语言。ECMAScript3要求JavaScript必须支持Unicode2.1及后续版本，ECMAScript5则要求支持Unicode3及后续版本。所以，我们编写出来的javascript程序，都是使用Unicode编码的。

// UTF-8
// UTF-8（UTF8-bit Unicode Transformation Format）是一种针对Unicode的可变长度字符编码，也是一种前缀码。
// 它可以用来表示Unicode标准中的任何字符，且其编码中的第一个字节仍与ASCII兼容，这使得原来处理ASCII字符的软件无须或只须做少部分修改，即可继续使用。因此，它逐渐成为电子邮件、网页及其他存储或发送文字的应用中，优先采用的编码。
// 目前大部分的网站，都是使用的UTF-8编码。

// 将javascript生成的Unicode编码字符串转为UTF-8编码的字符串
// 如标题所说的应用场景十分常见，例如发送一段二进制到服务器时，服务器规定该二进制内容的编码必须为UTF-8。这种情况下，我们必须就要通过程序将javascript的Unicode字符串转为UTF-8编码的字符串。

// 1、获取汉字Unicode值大小
var str = '中';
var charCode = str.charCodeAt(0);
console.log(charCode); // => 20013

// 2、根据大小判断UTF8的长度
// 由上一步我们得到汉字"中"的charCode为20013.然后我们发现20013位于2048 - 0xFFFF这个区间里，所以汉字"中"应该在UTF8中占3个字节。

// 3、补码
// 既然知道汉字"中"需要占3个字节，那么这3个字节如何得到哪？
// 具体的补位码如下,"x"表示空位，用来补位的。

// 0xxxxxxx
// 110xxxxx 10xxxxxx
// 1110xxxx 10xxxxxx 10xxxxxx
// 11110xxx 10xxxxxx 10xxxxxx 10xxxxxx
// 111110xx 10xxxxxx 10xxxxxx 10xxxxxx 10xxxxxx
// 1111110x 10xxxxxx 10xxxxxx 10xxxxxx 10xxxxxx 10xxxxxx

// 补位码第一个字节前面有几个1就表示整个UTF-8编码占多少个字节

// 先举个简单的例子。把英文字母"A"转为UTF8编码。
// 1、“A”的charCode为65
// 2、65位于0-127的区间，所以“A”占一个字节
// 3、UTF8中一个字节的补位为0xxxxxxx，x表示的是空位，是用来补位的。
// 4、将65转为二进制得到1000001
// 5、将1000001按照从前到后的顺序，依次补到0xxxxxxx的空位中，得到01000001
// 6、将01000001转为字符串，得到"A"
// 7、最终，"A"为UTF8编码之后“A”

// 我们已经得到了"中"的charCode为20013，二进制为01001110 00101101。具体如下：

var code = 20013;
code.toString(2); 
// => 100111000101101 等同于 01001110 00101101

// 我们按照上面“A”补位的方法，来给"中"补位。
// 将01001110 00101101按照从前到后的顺序依此补位到1110xxxx 10xxxxxx 10xxxxxx上.得到11100100 10111000 10101101

// 4、得到UTF8编码的内容
// 通过上面的步骤，我们得到了"中"的三个UTF8字节，11100100 10111000 10101101
// 我们将每个字节转为16进制，得到0xE4 0xB8 0xAD
// 那么这个0xE4 0xB8 0xAD就是我们最终得到的UTF8编码了

// 代码实现

// 将字符串格式化为UTF8编码的字节
var writeUTF = function (str, isGetBytes) {
    var back = [];
    var byteSize = 0;
    for (var i = 0; i < str.length; i++) {
        var code = str.charCodeAt(i);
        if (0x00 <= code && code <= 0x7f) {
              byteSize += 1;
              back.push(code);
        } else if (0x80 <= code && code <= 0x7ff) {
              byteSize += 2;
              back.push((192 | (31 & (code >> 6))));
              back.push((128 | (63 & code)))
        } else if ((0x800 <= code && code <= 0xd7ff) 
                || (0xe000 <= code && code <= 0xffff)) {
              byteSize += 3;
              back.push((224 | (15 & (code >> 12))));
              back.push((128 | (63 & (code >> 6))));
              back.push((128 | (63 & code)))
        }
     }
     for (i = 0; i < back.length; i++) {
          back[i] &= 0xff;
     }
     if (isGetBytes) {
          return back
     }
     if (byteSize <= 0xff) {
          return [0, byteSize].concat(back);
     } else {
          return [byteSize >> 8, byteSize & 0xff].concat(back);
      }
}

writeUTF('中'); // =>  [0, 3, 228, 184, 173] 
// 前两位表示后面utf8字节的长度。因为长度为3，所以前两个字节为`0，3`
// 内容为`228, 184, 173`转成16进制就是`0xE4 0xB8 0xAD`

// 读取UTF8编码的字节，并专为Unicode的字符串
var readUTF = function (arr) {
    if (typeof arr === 'string') {
        return arr;
    }
    var UTF = '', _arr = this.init(arr);
    for (var i = 0; i < _arr.length; i++) {
        var one = _arr[i].toString(2),
                v = one.match(/^1+?(?=0)/);
        if (v && one.length == 8) {
            var bytesLength = v[0].length;
            var store = _arr[i].toString(2).slice(7 - bytesLength);
            for (var st = 1; st < bytesLength; st++) {
                store += _arr[st + i].toString(2).slice(2)
            }
            UTF += String.fromCharCode(parseInt(store, 2));
            i += bytesLength - 1
        } else {
            UTF += String.fromCharCode(_arr[i])
        }
    }
    return UTF
}

readUTF([0, 3, 228, 184, 173]); // => '中'

// 三、写一个正则表达式，匹配所有的字符串直接量，单引号和双引号

var reg=/\"([^\"]*)\"/g

