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
        const blocks = text.split('@'); // Memisahkan blok berdasarkan tanda @
        const container = document.getElementById('list-container');
        container.innerHTML = ''; // Kosongkan list container sebelum menambahkan yang baru
        completedTasks = 0; // Reset jumlah task yang selesai
        totalTasks = 0; // Reset total task

        blocks.forEach((block, index) => {
            block = block.trim();
            if (block === '') return; // Lewati blok kosong

            // Memisahkan item judul, link, dan deskripsi
            const titleMatch = block.match(/#\s*([^\n]+)/);
            const linkMatch = block.match(/\{\s*([^}]+)\}/);
            const descriptionMatch = block.match(/\[\s*([^\]]+)\]/);

            const title = titleMatch ? titleMatch[1].trim() : '-';
            const link = linkMatch ? linkMatch[1].trim() : '-';
            const description = descriptionMatch ? descriptionMatch[1].trim() : '-';

            // Tambahkan blok ke container
            addAirdropBlock(title, link, description);
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

    const blockItem = document.createElement('div');
    blockItem.classList.add('block-item');

    // Judul
    const titleElement = document.createElement('div');
    titleElement.classList.add('main-title');
    titleElement.textContent = title;
    blockItem.appendChild(titleElement);

    // Link
    const linkElement = document.createElement('div');
    linkElement.classList.add('link-container');
    const linkText = document.createElement('span');
    linkText.textContent = link;
    linkText.classList.add('link-text');
    linkElement.appendChild(linkText);

    // Deskripsi
    const descriptionElement = document.createElement('div');
    descriptionElement.classList.add('description');

    // Mempertahankan baris baru dalam deskripsi
    const descriptionLines = description.split('\n'); // Pisahkan deskripsi berdasarkan baris baru
    descriptionLines.forEach(line => {
        const lineElement = document.createElement('div');
        lineElement.textContent = line.trim(); // Hilangkan spasi di awal dan akhir
        descriptionElement.appendChild(lineElement);
    });

    // Tombol Open/Cancel (hanya jika link valid)
    if (link !== '-') {
        totalTasks++; // Tambahkan ke total task

        const button = document.createElement('button');
        button.textContent = 'Open';
        button.onclick = function () {
            if (button.textContent === 'Open') {
                window.open(link, '_blank'); // Buka link di tab baru
                linkText.classList.add('strikethrough'); // Coret teks link
                button.textContent = 'Cancel';
                button.classList.add('cancel');
                completedTasks++; // Tambahkan ke task yang selesai

                // Tampilkan deskripsi saat tombol Open diklik
                descriptionElement.classList.add('visible');
            } else {
                linkText.classList.remove('strikethrough'); // Hapus coretan
                button.textContent = 'Open';
                button.classList.remove('cancel');
                completedTasks--; // Kurangi task yang selesai

                // Sembunyikan deskripsi saat tombol Cancel diklik
                descriptionElement.classList.remove('visible');
            }

            // Cek apakah semua task selesai
            checkCompletion();
        };
        linkElement.appendChild(button);
    }

    blockItem.appendChild(linkElement);
    blockItem.appendChild(descriptionElement);

    // Toggle show/hide deskripsi saat .link-container diklik
    linkElement.addEventListener('click', function (event) {
        // Pastikan yang diklik bukan tombol Open
        if (!event.target.tagName === 'BUTTON') {
            descriptionElement.classList.toggle('visible');
        }
    });

    container.appendChild(blockItem);
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

// URL file notifikasi
const notifUrl = "https://raw.githubusercontent.com/abcdrop/airdrop/refs/heads/main/notifications/messages.txt";

// Fungsi untuk toggle notifikasi box
async function toggleNotifBox() {
    const notifBox = document.getElementById("notifBox");
    const notifContent = document.getElementById("notifContent");

    // Jika notifikasi box sedang tersembunyi, muat konten notifikasi
    if (notifBox.classList.contains("hidden")) {
        try {
            const response = await fetch(notifUrl);
            if (!response.ok) {
                throw new Error("Gagal mengambil notifikasi");
            }
            const text = await response.text();
            const lines = text.split("\n").filter(line => line.trim() !== ""); // Pisahkan baris dan hilangkan baris kosong

            // Kosongkan konten notifikasi sebelum menambahkan yang baru
            notifContent.innerHTML = "";

            // Tambahkan baris dalam urutan terbalik (baris terakhir di file menjadi pertama ditampilkan)
            lines.reverse().forEach(line => {
                const notifItem = document.createElement("div");
                notifItem.classList.add("notif-item");
                notifItem.textContent = line.trim();
                notifContent.appendChild(notifItem);
            });
        } catch (error) {
            console.error("Error:", error);
            alert("Gagal memuat notifikasi: " + error.message);
        }
    }

    // Toggle tampilan notifikasi box
    notifBox.classList.toggle("hidden");

    // Jika notifikasi box ditampilkan, tambahkan event listener untuk menutupnya saat klik di luar
    if (!notifBox.classList.contains("hidden")) {
        document.addEventListener("click", closeNotifBoxOnClickOutside);
    } else {
        document.removeEventListener("click", closeNotifBoxOnClickOutside);
    }
}

// Fungsi untuk menutup notifikasi box saat mengklik di luar box
function closeNotifBoxOnClickOutside(event) {
    const notifBox = document.getElementById("notifBox");
    const notifButton = document.getElementById("notifButton");

    // Periksa apakah klik terjadi di luar notifikasi box dan tombol notifikasi
    if (!notifBox.contains(event.target) && !notifButton.contains(event.target)) {
        notifBox.classList.add("hidden");
        document.removeEventListener("click", closeNotifBoxOnClickOutside);
    }
}