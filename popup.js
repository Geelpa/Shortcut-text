const form = document.getElementById("formAtalho");
const lista = document.getElementById("lista");
const btnSalvar = document.getElementById("btnSalvar");

let editIndex = null;

async function atualizarLista() {
    const { atalhos } = await chrome.storage.sync.get({ atalhos: [] });
    lista.innerHTML = "";

    atalhos.forEach((a, i) => {
        const li = document.createElement("li");

        li.innerHTML = `
      <span class="codigo">${a.codigo}</span>
      <span class="conteudo">${a.conteudo}</span>
      <div class="acoes">
        <button class="btn-editar">✏️ Editar</button>
        <button class="btn-excluir">🗑️ Excluir</button>
      </div>
    `;

        // Excluir
        li.querySelector(".btn-excluir").addEventListener("click", async () => {
            if (!confirm(`Excluir o atalho ${a.codigo}?`)) return;
            const novos = atalhos.filter((_, idx) => idx !== i);
            await chrome.storage.sync.set({ atalhos: novos });
            atualizarLista();
        });

        // Editar
        li.querySelector(".btn-editar").addEventListener("click", () => {
            document.getElementById("codigo").value = a.codigo;
            document.getElementById("conteudo").value = a.conteudo;
            editIndex = i;
            btnSalvar.textContent = "Atualizar";
        });

        lista.appendChild(li);
    });
}

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const codigo = document.getElementById("codigo").value.trim();
    const conteudo = document.getElementById("conteudo").value.trim();

    if (!codigo || !conteudo) return;

    const { atalhos } = await chrome.storage.sync.get({ atalhos: [] });

    if (editIndex !== null) {
        atalhos[editIndex] = { codigo, conteudo };
        editIndex = null;
        btnSalvar.textContent = "Salvar";
    } else {
        atalhos.push({ codigo, conteudo });
    }

    await chrome.storage.sync.set({ atalhos });
    form.reset();
    atualizarLista();
});

atualizarLista();
