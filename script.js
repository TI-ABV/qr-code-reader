const video = document.getElementById('video')
const output = document.getElementById('output')
let scanResult = ''

// Acessar a câmera
navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }).then((stream) => {
    video.srcObject = stream;
});

// Função para ler QR Code a partir do vídeo
function scanQRCode() {
    if (admin) return

    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
    const code = jsQR(imageData.data, imageData.width, imageData.height)

    if (code) {
        if (scanResult !== code.data) {
            scanResult = code.data
            output.textContent = `QR Code Detected: ${scanResult}`
            salvarDados(scanResult)
            // sendToGoogleSheets(scanResult);

        }
    }
}

// Função para enviar os dados do QR Code ao Google Sheets
function sendToGoogleSheets(qrData) {
    console.log(qrData)
    const url = "https://script.google.com/macros/s/AKfycbx_4CEY6Jman7yJHWyx2WQtVCyf-aVkJOZhfsfiKkv6qYj0WDB6-wBlGfckJH2hCGZW/exec";


    // Certifique-se de que existam 4 partes separadas no QR Code
    const data = {
        nome: qrData.nome,
        cpf: qrData.CPFCNPJ,
        placa: qrData.placa,
        classificacao: qrData.classificacao
    }

    fetch(url, {
        method: "POST",
        mode: "no-cors",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data)
    })
        .then(response => {
            output.textContent = "\nData sent to Google Sheets!"
        })
        .catch(error => {
            output.textContent = "\nError sending data: " + error.message
        })
}

setInterval(scanQRCode, 1000) // Scannear a cada segundo



import { initializeApp } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-app.js"
import { getFirestore, collection, addDoc, getDocs, updateDoc, doc } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js"

const firebaseConfig = {
    apiKey: "AIzaSyA3HgnS-wAXWrHaqaOVlsbBch8QQwhJmLY",
    authDomain: "qrcode-abv.firebaseapp.com",
    projectId: "qrcode-abv",
    storageBucket: "qrcode-abv.firebasestorage.app",
    messagingSenderId: "4891489428",
    appId: "1:4891489428:web:dbf7e4342b54660a9f7081"
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export async function salvarDados(dados) {
    dados = dados.split(',')

    try {
        const doc = await addDoc(collection(db, 'Veículos'), {
            nome: dados[0],
            CPFCNPJ: dados[1],
            placa: dados[2],
            classificacao: dados[3],
            data: new Date()
        })

        output.textContent = 'Dados salvos com sucesso: ' + dados[0]
    } catch (erro) {
        console.error('Não foi possível salvar os dados: ', erro)
        output.textContent = 'Não foi possível salvar os dados'
    }
}


export async function enviarDados() {
    try {
        console.log('Enviando os dados!')
        const dados = await getDocs(collection(db, 'Veículos'))

        for (const dado of dados.docs) {
            const enviado = dado.data().enviado

            if (enviado) continue

            sendToGoogleSheets(dado.data())

            const id = doc(db, 'Veículos', dado.id)
            await updateDoc(id, {
                ['enviado']: true
            })
        }

        console.log('Dados enviados com sucesso!')
        alert('Dados enviados com sucesso!')
    } catch (erro) {
        console.error('Não foi possível enviar os dados: ', erro)
        console.error(erro)
    }
}