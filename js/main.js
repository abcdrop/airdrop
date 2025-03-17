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
        // Pisahkan blok hanya jika @ berada di awal baris atau setelah baris baru
        const blocks = text.split(/(?<=^|\n)@\s*\n/); // Regex untuk split @ di awal baris
        const container = document.getElementById('list-container');
        container.innerHTML = ''; // Kosongkan list container sebelum menambahkan yang baru
        completedTasks = 0; // Reset jumlah task yang selesai
        totalTasks = 0; // Reset total task

        blocks.forEach((block, index) => {
            block = block.trim();
            if (block === '') return; // Lewati blok kosong

            // Memisahkan item judul, link, dan deskripsi
            const titleMatch = block.match(/#\s*([^\n]+)/);
            const linkMatches = block.match(/\{\s*([^}]+)\}/g) || [];
            const descriptionMatches = block.match(/\[\s*([^\]]+)\]/g) || [];

            const title = titleMatch ? titleMatch[1].trim() : '-';

            // Proses link yang dipisahkan dengan koma atau baris baru
            const links = [];
            linkMatches.forEach(linkGroup => {
                const linkContent = linkGroup.replace(/[{}]/g, '').trim();
                // Pisahkan link berdasarkan koma atau baris baru
                const splitLinks = linkContent.split(/[\n,]/).map(link => link.trim()).filter(link => link !== '');
                links.push(...splitLinks);
            });

            const descriptions = descriptionMatches.map(desc => desc.replace(/[\[\]]/g, '').trim());

            // Tambahkan blok ke container
            addAirdropBlock(title, links, descriptions);
        });

        // Sembunyikan pesan selesai saat memuat file baru
        document.getElementById('completion-message').classList.add('hidden');
        document.getElementById('list-container').classList.remove('hidden'); // Tampilkan list
    } catch (error) {
        alert('Terjadi kesalahan: ' + error.message);
    }
}

// Menambahkan Blok Airdrop ke container
function addAirdropBlock(title, links, descriptions) {
    const container = document.getElementById('list-container');

    const blockItem = document.createElement('div');
    blockItem.classList.add('block-item');

    // Judul
    const titleElement = document.createElement('div');
    titleElement.classList.add('main-title');
    titleElement.textContent = title;
    blockItem.appendChild(titleElement);

    // Jika tidak ada link, tampilkan deskripsi langsung
    if (links.length === 0) {
        const descriptionElement = document.createElement('div');
        descriptionElement.classList.add('description', 'visible');
        descriptionElement.innerHTML = descriptions.join('<br>');
        blockItem.appendChild(descriptionElement);
    } else {
        // Proses setiap link
        links.forEach((link, index) => {
            const linkElement = document.createElement('div');
            linkElement.classList.add('link-container');

            const linkText = document.createElement('span');
            linkText.textContent = link;
            linkText.classList.add('link-text');
            linkElement.appendChild(linkText);

            // Tombol Open/Cancel
            const button = document.createElement('button');
            button.textContent = 'Open';
            button.onclick = function (event) {
                event.stopPropagation(); // Menghentikan event bubbling

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
            linkElement.appendChild(button);

            blockItem.appendChild(linkElement);
        });

        // Deskripsi (gunakan deskripsi gabungan jika jumlah deskripsi tidak sesuai)
        const descriptionElement = document.createElement('div');
        descriptionElement.classList.add('description');

        // Gabungkan semua deskripsi dan pertahankan baris baru
        const combinedDescription = descriptions.join('\n'); // Gabungkan dengan baris baru
        const descriptionLines = combinedDescription.split('\n'); // Pisahkan berdasarkan baris baru

        // Tambahkan setiap baris deskripsi sebagai elemen terpisah
        descriptionLines.forEach(line => {
            const lineElement = document.createElement('div');
            lineElement.textContent = line.trim(); // Hilangkan spasi di awal dan akhir
            descriptionElement.appendChild(lineElement);
        });

        // Toggle show/hide deskripsi saat div blok diklik
        blockItem.addEventListener('click', function () {
            descriptionElement.classList.toggle('visible');
        });

        blockItem.appendChild(descriptionElement);
    }

    container.appendChild(blockItem);

    // Update totalTasks dengan jumlah tombol "Open" yang ada
    totalTasks += links.length;
}

// Cek apakah semua task selesai
function checkCompletion() {
    const allButtons = document.querySelectorAll('.link-container button');
    let allCompleted = true;

    allButtons.forEach(button => {
        if (button.textContent === 'Open') {
            allCompleted = false;
        }
    });

    if (allCompleted) {
        document.getElementById('completion-message').classList.remove('hidden');
    } else {
        document.getElementById('completion-message').classList.add('hidden');
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

// Memanggil fungsi untuk mengambil daftar file saat halaman dimuat
fetchFileList();

// Fungsi untuk toggle tombol Edit/Save
function toggleEditSave() {
    const editSaveButton = document.getElementById('editSaveButton');
    if (editSaveButton.textContent === 'Edit') {
        editSaveButton.textContent = 'Save';
        // Tambahkan logika untuk mode edit di sini (jika diperlukan)
    } else {
        editSaveButton.textContent = 'Edit';
        // Tambahkan logika untuk mode save di sini (jika diperlukan)
    }
}


let isEditMode = false; // Status mode edit

// Fungsi untuk toggle tombol Edit/Save
function toggleEditSave() {
    const editSaveButton = document.getElementById('editSaveButton');
    isEditMode = !isEditMode; // Toggle status mode edit

    if (isEditMode) {
        editSaveButton.textContent = 'Save';
        enableEditMode(); // Aktifkan mode edit
    } else {
        editSaveButton.textContent = 'Edit';
        disableEditMode(); // Nonaktifkan mode edit
    }
}

// Fungsi untuk mengaktifkan mode edit
function enableEditMode() {
    const blocks = document.querySelectorAll('.block-item');

    blocks.forEach(block => {
        // Tambahkan tombol hapus blok
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete Block';
        deleteButton.classList.add('edit-mode-button', 'delete');
        deleteButton.onclick = () => block.remove();
        block.appendChild(deleteButton);

        // Ubah judul menjadi input
        const titleElement = block.querySelector('.main-title');
        const titleInput = document.createElement('input');
        titleInput.type = 'text';
        titleInput.value = titleElement.textContent;
        titleInput.classList.add('edit-mode-input');
        titleElement.replaceWith(titleInput);

        // Ubah link menjadi input
        const linkContainers = block.querySelectorAll('.link-container');
        linkContainers.forEach(linkContainer => {
            const linkText = linkContainer.querySelector('.link-text');
            const linkInput = document.createElement('input');
            linkInput.type = 'text';
            linkInput.value = linkText.textContent;
            linkInput.classList.add('edit-mode-input');
            linkText.replaceWith(linkInput);

            // Tambahkan tombol hapus link
            const deleteLinkButton = document.createElement('button');
            deleteLinkButton.textContent = 'Delete Link';
            deleteLinkButton.classList.add('edit-mode-button', 'delete');
            deleteLinkButton.onclick = () => linkContainer.remove();
            linkContainer.appendChild(deleteLinkButton);
        });

        // Ubah deskripsi menjadi textarea
        const descriptionElement = block.querySelector('.description');
        const descriptionTextarea = document.createElement('textarea');
        descriptionTextarea.value = descriptionElement.textContent;
        descriptionTextarea.classList.add('edit-mode-input');
        descriptionElement.replaceWith(descriptionTextarea);

        // Tambahkan tombol tambah link baru
        const addLinkButton = document.createElement('button');
        addLinkButton.textContent = 'Add New Link';
        addLinkButton.classList.add('edit-mode-button', 'add');
        addLinkButton.onclick = () => {
            const newLinkInput = document.createElement('input');
            newLinkInput.type = 'text';
            newLinkInput.placeholder = 'Enter new link';
            newLinkInput.classList.add('edit-mode-input');
            block.insertBefore(newLinkInput, descriptionTextarea);
        };
        block.appendChild(addLinkButton);
    });

    // Tambahkan tombol untuk menambah blok baru
    const addBlockButton = document.createElement('button');
    addBlockButton.textContent = 'Add New Block';
    addBlockButton.classList.add('edit-mode-button', 'add');
    addBlockButton.onclick = addNewBlock;
    document.getElementById('list-container').appendChild(addBlockButton);
}

// Fungsi untuk menonaktifkan mode edit
function disableEditMode() {
    const blocks = document.querySelectorAll('.block-item');

    blocks.forEach(block => {
        // Kembalikan judul ke elemen teks
        const titleInput = block.querySelector('input[type="text"]');
        const titleElement = document.createElement('div');
        titleElement.classList.add('main-title');
        titleElement.textContent = titleInput.value;
        titleInput.replaceWith(titleElement);

        // Kembalikan link ke elemen teks
        const linkInputs = block.querySelectorAll('input[type="text"]');
        linkInputs.forEach(linkInput => {
            const linkText = document.createElement('span');
            linkText.classList.add('link-text');
            linkText.textContent = linkInput.value;
            linkInput.replaceWith(linkText);
        });

        // Kembalikan deskripsi ke elemen teks
        const descriptionTextarea = block.querySelector('textarea');
        const descriptionElement = document.createElement('div');
        descriptionElement.classList.add('description');
        descriptionElement.textContent = descriptionTextarea.value;
        descriptionTextarea.replaceWith(descriptionElement);
    });

    // Hapus semua tombol edit yang ditambahkan
    const editButtons = document.querySelectorAll('.edit-mode-button');
    editButtons.forEach(button => button.remove());
}

// Fungsi untuk menambah blok baru
function addNewBlock() {
    const newBlock = document.createElement('div');
    newBlock.classList.add('block-item');

    // Judul baru
    const titleInput = document.createElement('input');
    titleInput.type = 'text';
    titleInput.placeholder = 'Enter title';
    titleInput.classList.add('edit-mode-input');
    newBlock.appendChild(titleInput);

    // Link baru
    const linkInput = document.createElement('input');
    linkInput.type = 'text';
    linkInput.placeholder = 'Enter link';
    linkInput.classList.add('edit-mode-input');
    newBlock.appendChild(linkInput);

    // Deskripsi baru
    const descriptionTextarea = document.createElement('textarea');
    descriptionTextarea.placeholder = 'Enter description';
    descriptionTextarea.classList.add('edit-mode-input');
    newBlock.appendChild(descriptionTextarea);

    // Tombol hapus blok
    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Delete Block';
    deleteButton.classList.add('edit-mode-button', 'delete');
    deleteButton.onclick = () => newBlock.remove();
    newBlock.appendChild(deleteButton);

    // Tambahkan blok baru ke container
    document.getElementById('list-container').appendChild(newBlock);
}

// Fungsi untuk membuat ulang file .txt dari data yang dimodifikasi
function recreateTxtFile() {
    const blocks = document.querySelectorAll('.block-item');
    let fileContent = '';

    blocks.forEach(block => {
        // Ambil judul
        const title = block.querySelector('.main-title').textContent;
        fileContent += `# ${title}\n`;

        // Ambil semua link
        const links = block.querySelectorAll('.link-text');
        if (links.length > 0) {
            fileContent += '{';
            links.forEach((link, index) => {
                fileContent += link.textContent;
                if (index < links.length - 1) fileContent += ', ';
            });
            fileContent += '}\n';
        }

        // Ambil deskripsi dan pertahankan baris baru
        const descriptionElement = block.querySelector('.description');
        if (descriptionElement) {
            // Gunakan childNodes untuk mengambil teks dan baris baru
            let descriptionText = '';
            descriptionElement.childNodes.forEach(node => {
                if (node.nodeType === Node.TEXT_NODE) {
                    descriptionText += node.textContent.trim() + '\n'; // Tambahkan baris baru
                } else if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'DIV') {
                    descriptionText += node.textContent.trim() + '\n'; // Tambahkan baris baru untuk setiap <div>
                }
            });

            // Pisahkan deskripsi berdasarkan baris baru
            const descriptionLines = descriptionText.split('\n').filter(line => line.trim() !== '');
            descriptionLines.forEach(line => {
                fileContent += `[${line.trim()}]\n`; // Apit setiap baris dengan []
            });
        }

        // Tambahkan pemisah blok
        fileContent += '@\n\n';
    });

    return fileContent.trim(); // Hilangkan spasi di akhir
}


// Fungsi untuk memicu pengunduhan file .txt
function exportTxtFile() {
    const fileName = document.getElementById('fileInput').value.trim();
    if (!fileName) {
        alert('Silakan masukkan nama file terlebih dahulu!');
        return;
    }

    const fileContent = recreateTxtFile(); // Buat ulang konten file
    const blob = new Blob([fileContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);

    // Buat elemen <a> untuk memicu pengunduhan
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Tambahkan event listener untuk tombol Export
document.getElementById('exportButton').addEventListener('click', exportTxtFile);