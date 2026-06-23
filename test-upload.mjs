import fs from 'fs';

// A minimal valid PDF in base64
const pdfBase64 = "JVBERi0xLjcKCjEgMCBvYmogICUgZW50cnkgcG9pbnQKPDwKICAvVHlwZSAvQ2F0YWxvZwogIC9QYWdlcyAyIDAgUgo+PgplbmRvYmoKCjIgMCBvYmoKPDwKICAvVHlwZSAvUGFnZXMKICAvTWVkaWFCb3ggWyAwIDAgMjAwIDIwMCBdCiAgL0NvdW50IDEKICAvS2lkcyBbIDMgMCBSIF0KPj4KZW5kb2JqCgozIDAgb2JqCjw8CiAgL1R5cGUgL1BhZ2UKICAvUGFyZW50IDIgMCBSCiAgL1Jlc291cmNlcyA8PAogICAgL0ZvbnQgPDwKICAgICAgL0YxIDQgMCBSCgkvRjIgNSAwIFIKICAgID4+CiAgPj4KICAvQ29udGVudHMgNiAwIFIKPj4KZW5kb2JqCgo0IDAgb2JqCjw8CiAgL1R5cGUgL0ZvbnQKICAvU3VidHlwZSAvVHlwZTEKICAvQmFzZUZvbnQgL1RpbWVzLVJvbWFuCj4+CmVuZG9iagoKNSAwIG9iago8PAogIC9UeXBlIC9Gb250CiAgL1N1YnR5cGUgL1R5cGUxCiAgL0Jhc2VGb250IC9IZWx2ZXRpY2EKPj4KZW5kb2JqCgo2IDAgb2JqCjw8CiAgL0xlbmd0aCA3MyA+PgpzdHJlYW0KICBCVAogICAgL0YxIDE4IFRmCiAgICAwIDAgVCB1cnINCiAgICAoSGVsbG8gV29ybGQpIFRkDQogICAgL0YyIDI0IFRmDQogICAgKFRoaXMgaXMgbXkgcmVzdW1lKSAzMCA0MCBUZA0KICBFVAplbmRzdHJlYW0KZW5kb2JqCgp4cmVmCjAgNwowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMTAgMDAwMDAgbiAKMDAwMDAwMDA3OSAwMDAwMCBuIAowMDAwMDAwMTczIDAwMDAwIG4gCjAwMDAwMDAzMDEgMDAwMDAgbiAKMDAwMDAwMDM4OCAwMDAwMCBuIAowMDAwMDAwNDc2IDAwMDAwIG4gCnRyYWlsZXIKPDwKICAvU2l6ZSA3CiAgL1Jvb3QgMSAwIFIKPj4Kc3RhcnR4cmVmCjYwMAolJUVPRgo=";

async function testUpload() {
  const res = await fetch('http://127.0.0.1:3000/api/extract-resume', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileBase64: pdfBase64, mimeType: 'application/pdf' })
  });
  
  if (!res.ok) {
     const text = await res.text();
     console.error("HTTP error!", res.status, text);
     process.exit(1);
  } else {
     const data = await res.json();
     console.log("Success:", data);
  }
}

testUpload();
