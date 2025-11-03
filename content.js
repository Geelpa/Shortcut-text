let atalhos = [];

// Carrega atalhos salvos
chrome.storage.sync.get({ atalhos: [] }, (res) => {
    atalhos = res.atalhos || [];
});

// Atualiza dinamicamente se alterar pelo popup
chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "sync" && changes.atalhos) {
        atalhos = changes.atalhos.newValue || [];
    }
});

// Detecta e substitui atalhos no texto
function substituirAtalhos(texto) {
    let novoTexto = texto;
    for (const { codigo, conteudo } of atalhos) {
        if (novoTexto.includes(codigo)) {
            novoTexto = novoTexto.replaceAll(codigo, conteudo);
        }
    }
    return novoTexto;
}

// Substitui valor nativamente (compatível com React/Vue)
function setNativeValue(el, value) {
    const valueSetter = Object.getOwnPropertyDescriptor(el.__proto__, "value")?.set;
    const prototype = Object.getPrototypeOf(el);
    const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;

    if (valueSetter && valueSetter !== prototypeValueSetter) {
        prototypeValueSetter.call(el, value);
    } else {
        valueSetter.call(el, value);
    }
}

// Envia evento de input para frameworks reconhecerem a mudança
function triggerInputEvent(el) {
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
}

// Atualiza texto nos campos padrão
function handleInput(e) {
    const el = e.target;

    if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
        const original = el.value;
        const novo = substituirAtalhos(original);
        if (novo !== original) {
            setNativeValue(el, novo);
            triggerInputEvent(el);
        }
    } else if (el.isContentEditable) {
        const original = el.innerText;
        const novo = substituirAtalhos(original);
        if (novo !== original) {
            el.innerText = novo;

            // Reposiciona cursor no final
            const range = document.createRange();
            range.selectNodeContents(el);
            range.collapse(false);
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
        }
    }
}

// Adiciona listeners a todos os campos existentes e futuros
function observarCampos() {
    // Função para ligar eventos a um elemento
    function ligarEventos(el) {
        if (el._atalhoMonitorado) return;
        el._atalhoMonitorado = true;
        el.addEventListener("input", handleInput);
    }

    // Ligar nos elementos atuais
    document.querySelectorAll("input:not([type=hidden]), textarea, [contenteditable='true'], [contenteditable='']").forEach(ligarEventos);

    // Observar novos elementos adicionados dinamicamente
    const observer = new MutationObserver((mutations) => {
        for (const m of mutations) {
            m.addedNodes.forEach((n) => {
                if (n.nodeType !== 1) return; // ignora nós de texto
                if (n.matches && (n.matches("input:not([type=hidden])") || n.matches("textarea") || n.isContentEditable)) {
                    ligarEventos(n);
                }
                if (n.querySelectorAll) {
                    n.querySelectorAll("input:not([type=hidden]), textarea, [contenteditable='true'], [contenteditable='']").forEach(ligarEventos);
                }
            });
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
}

observarCampos();
