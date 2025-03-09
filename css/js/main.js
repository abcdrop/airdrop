const repoOwner = 'abcdrop';          // Nama pemilik repository
const repoName = 'airdrop';           // Nama repository
const folderPath = 'list';            // Folder tempat file .txt disimpan

let completedTasks = 0;               // Menghitung jumlah task yang selesai
let currentFileName = '';             // Menyimpan nama file yang sedang diproses

// Mengambil daftar file dari GitHub API
async function fetchFileList() {
    try {
        const response = await fetch(
            `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${folderPath}`
        );
        if (!response.ok) {
            throw new Error('Gagal mengambil daftar file');
        }
        const files = await response.json();
        const datalist = document.getElementById('fileList');

        // Mengurutkan file sesuai abjad (A-Z, 0-9)
        files
            .filter(file => file.name.endsWith('.txt'))
            .map(file => file.name.replace('.txt', ''))
            .sort((a, b) => a.localeCompare(b, 'en', { numeric: true }))
            .forEach(fileName => {
                const option = document.createElement('option');
                option.value = fileName;
                datalist.appendChild(option);
            });
    } catch (error) {
        console.error('Error:', error);
    }
}

// Memuat isi file yang dipilih
async function loadFile() {
    const fileInput = document.getElementById('fileInput').value;
    if (!fileInput) {
        alert('Silakan pilih file terlebih dahulu!');
        return;
    }

    currentFileName = fileInput; // Simpan nama file yang sedang diproses

    try {
        const response = await fetch(
            `https://raw.githubusercontent.com/${repoOwner}/${repoName}/main/${folderPath}/${fileInput}.txt`
        );
        if (!response.ok) {
            throw new Error('File tidak ditemukan');
        }
        const text = await response.text();

        // Memproses isi file
        const lines = text.split('\n'); // Memisahkan berdasarkan baris baru
        const container = document.getElementById('list-container');
        container.innerHTML = ''; // Kosongkan list container sebelum menambahkan yang baru
        completedTasks = 0; // Reset jumlah task yang selesai

        lines.forEach(line => {
            if (line.trim() !== '') {
                addListItem(line.trim());
            }
        });

        // Sembunyikan pesan selesai saat memuat file baru
        document.getElementById('completion-message').classList.add('hidden');
        document.getElementById('list-container').classList.remove('hidden'); // Tampilkan list
    } catch (error) {
        alert('Terjadi kesalahan: ' + error.message);
    }
}

// Menambahkan list item ke container
function addListItem(text) {
    const container = document.getElementById('list-container');

    const listItem = document.createElement('div');
    listItem.classList.add('list-item');

    const span = document.createElement('span');
    span.textContent = text;

    const button = document.createElement('button');
    button.textContent = 'Open';
    button.onclick = function () {
        if (button.textContent === 'Open') {
            window.open(text, '_blank');
            span.classList.add('strikethrough');
            button.textContent = 'Cancel';
            button.classList.add('cancel');
            completedTasks++;
        } else {
            span.classList.remove('strikethrough');
            button.textContent = 'Open';
            button.classList.remove('cancel');
            completedTasks--;
        }

        // Cek apakah semua task selesai
        checkCompletion();
    };

    listItem.appendChild(span);
    listItem.appendChild(button);
    container.appendChild(listItem);
}

// Cek apakah semua task selesai
function checkCompletion() {
    const listItems = document.querySelectorAll('.list-item');
    const completionMessage = document.getElementById('completion-message');
    const listContainer = document.getElementById('list-container');

    if (completedTasks === listItems.length) {
        completionMessage.classList.remove('hidden');
        listContainer.classList.add('hidden'); // Sembunyikan list
    } else {
        completionMessage.classList.add('hidden');
        listContainer.classList.remove('hidden'); // Tampilkan list
    }
}

// Tombol Continue
function continueTask() {
    document.getElementById('completion-message').classList.add('hidden');
    document.getElementById('list-container').classList.remove('hidden'); // Tampilkan list kembali
}

// Tombol Reset
function resetTask() {
    // Kosongkan list container
    document.getElementById('list-container').innerHTML = '';
    // Sembunyikan list dan pesan completion
    document.getElementById('list-container').classList.add('hidden');
    document.getElementById('completion-message').classList.add('hidden');
    // Kosongkan input suggestion
    document.getElementById('fileInput').value = '';
    // Reset counter
    completedTasks = 0;
    currentFileName = '';
}

// Memanggil fungsi untuk mengambil daftar file saat halaman dimuat
fetchFileList();
