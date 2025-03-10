const repoOwner = 'abcdrop';          // Nama pemilik repository
const repoName = 'airdrop';           // Nama repository
const folderPath = 'list';            // Folder tempat file .txt disimpan

let totalTasks = 0;                   // Menghitung total task (baik yang memiliki link maupun tidak)
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
        totalTasks = 0; // Reset total task

        let currentTitle = ''; // Judul
        let currentLink = ''; // Link
        let currentDescription = ''; // Deskripsi

        lines.forEach((line, index) => {
            line = line.trim();

            if (line === '') {
                // Jika baris kosong, buat Blok Airdrop baru
                if (currentTitle || currentLink || currentDescription) {
                    addAirdropBlock(currentTitle, currentLink, currentDescription);
                    currentTitle = '';
                    currentLink = '';
                    currentDescription = '';
                }
                return;
            }

            if (line.startsWith('#')) {
                // Jika baris adalah judul
                currentTitle = line.replace('#', '').trim();
            } else if (line.startsWith('http') || line.startsWith('www') || line.includes('.com')) {
                // Jika baris adalah link
                currentLink = line;
            } else {
                // Jika baris adalah deskripsi
                currentDescription = line;
            }

            // Jika ini baris terakhir, pastikan Blok Airdrop terakhir ditambahkan
            if (index === lines.length - 1) {
                if (currentTitle || currentLink || currentDescription) {
                    addAirdropBlock(currentTitle, currentLink, currentDescription);
                }
            }
        });

        // Sembunyikan pesan selesai saat memuat file baru
        document.getElementById('completion-message').classList.add('hidden');
        document.getElementById('list-container').classList.remove('hidden'); // Tampilkan list
    } catch (error) {
        alert('Terjadi kesalahan: ' + error.message);
    }
}

// Menambahkan Blok Airdrop ke container
function addAirdropBlock(title, link, description) {
    const container = document.getElementById('list-container');

    // Judul (jika ada)
    if (title) {
        const titleElement = document.createElement('div');
        titleElement.classList.add('main-title');
        titleElement.textContent = title;
        container.appendChild(titleElement);
    }

    // Link dan Deskripsi (jika ada)
    if (link || description) {
        const blockItem = document.createElement('div');
        blockItem.classList.add('block-item');

        // Jika tidak ada link, anggap task sudah selesai
        if (!link) {
            completedTasks++; // Tambahkan ke task yang selesai
            totalTasks++; // Tambahkan ke total task
            checkCompletion(); // Cek apakah semua task selesai
        }

        // Link (jika ada)
        if (link) {
            totalTasks++; // Tambahkan ke total task

            const linkContainer = document.createElement('div');
            linkContainer.classList.add('link-container');

            // Tampilkan teks link sebagai teks biasa (tanpa a href)
            const linkText = document.createElement('span');
            linkText.textContent = link;
            linkText.classList.add('link-text'); // Tambahkan class untuk styling
            linkContainer.appendChild(linkText);

            // Tombol Open/Cancel
            const button = document.createElement('button');
            button.textContent = 'Open';
            button.onclick = function () {
                if (button.textContent === 'Open') {
                    window.open(link, '_blank'); // Buka link di tab baru
                    linkText.classList.add('strikethrough'); // Coret teks link
                    button.textContent = 'Cancel';
                    button.classList.add('cancel');
                    completedTasks++; // Tambahkan ke task yang selesai
                } else {
                    linkText.classList.remove('strikethrough'); // Hapus coretan
                    button.textContent = 'Open';
                    button.classList.remove('cancel');
                    completedTasks--; // Kurangi task yang selesai
                }

                // Cek apakah semua task selesai
                checkCompletion();
            };
            linkContainer.appendChild(button);

            blockItem.appendChild(linkContainer);
        }

        // Deskripsi (jika ada)
        if (description) {
            const descriptionElement = document.createElement('div');
            descriptionElement.textContent = description;
            descriptionElement.classList.add('description');

            // Deskripsi hidden jika ada link, show jika tidak ada link
            if (link) {
                descriptionElement.classList.add('hidden');
                // Klik untuk toggle deskripsi
                blockItem.onclick = function () {
                    descriptionElement.classList.toggle('hidden');
                };
            }

            blockItem.appendChild(descriptionElement);
        }

        container.appendChild(blockItem);
    }
}

// Fungsi untuk mengecek apakah semua task selesai
function checkCompletion() {
    if (completedTasks === totalTasks) {
        document.getElementById('completion-message').classList.remove('hidden');
        document.getElementById('list-container').classList.add('hidden');
    } else {
        document.getElementById('completion-message').classList.add('hidden');
        document.getElementById('list-container').classList.remove('hidden');
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
    totalTasks = 0;
    currentFileName = '';
}

// Memanggil fungsi untuk mengambil daftar file saat halaman dimuat
fetchFileList();