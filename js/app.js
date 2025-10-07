// =========================================================
// 0. FUNÇÕES DE AUTENTICAÇÃO FIREBASE (NOVAS)
// =========================================================

// Elementos de Seção (CRÍTICO: ID's do HTML)
const loginSection = document.getElementById('login-section');
const appContainer = document.getElementById('app-container');
const loginErrorMessage = document.getElementById('login-error-message');

/**
 * Tenta fazer o login no Firebase com e-mail e senha.
 */
function fazerLogin() {
    loginErrorMessage.textContent = '';
    const email = document.getElementById('login-email').value;
    const senha = document.getElementById('login-senha').value;

    if (!email || !senha) {
        loginErrorMessage.textContent = "Preencha e-mail e senha.";
        return;
    }

    firebase.auth().signInWithEmailAndPassword(email, senha)
        .then(() => {
            // O onAuthStateChanged cuidará da navegação
        })
        .catch((error) => {
            let message = "Erro de Login. E-mail ou senha incorretos.";
            if (error.code === 'auth/user-not-found') {
                message = "Usuário não encontrado.";
            } else if (error.code === 'auth/wrong-password') {
                message = "Senha incorreta.";
            }
            loginErrorMessage.textContent = message;
            console.error(error);
        });
}

/**
 * Desloga o usuário do Firebase.
 */
function fazerLogout() {
    firebase.auth().signOut().then(() => {
        // O onAuthStateChanged cuidará da navegação
    }).catch((error) => {
        alert("Erro ao fazer logout: " + error.message);
    });
}


/**
 * Gerencia o estado de autenticação (logado ou deslogado).
 */
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        // USUÁRIO LOGADO: Mostra o CRM
        console.log("Usuário logado:", user.uid);
        if (loginSection) loginSection.style.display = 'none';
        if (appContainer) {
            appContainer.style.display = 'grid'; // Assumindo que seu .app-container usa grid/flex
            carregarDadosIniciais(); // Chama a função para carregar todos os dados
        }

    } else {
        // USUÁRIO DESLOGADO: Mostra a tela de login
        console.log("Nenhum usuário logado.");
        if (loginSection) {
            loginSection.style.display = 'flex';
            document.getElementById('login-senha').value = ''; // Limpa a senha
        }
        if (appContainer) appContainer.style.display = 'none';
    }
});

/**
 * Função principal para carregar os dados somente após o login.
 */
function carregarDadosIniciais() {
    // 1. Inicia os listeners de dados para atualizar as tabelas em tempo real
    iniciarListenersFirestore();

    // 2. Garante que a primeira seção é exibida (Clientes)
    mostrarSecao('clientes-section');
}

// =========================================================
// 1. Variáveis Globais e Inicialização
// (Removidas as variáveis de seção 'loginSection' e 'appSection' pois já estão no bloco 0)
// =========================================================

// Elementos da Navegação (Sidebar)
const navItems = document.querySelectorAll('.nav-item');
const topHeader = document.getElementById('top-header');

// Elementos de Seleção de Venda (Preenchidos dinamicamente)
const selectClienteVenda = document.createElement('select'); // Usado apenas como cache para dados
const selectProdutoVenda = document.createElement('select'); // Usado apenas como cache para dados

// CACHE PARA VENDAS: Armazenar clientes e produtos para mostrar o NOME em vez do ID.
let clientesCache = {}; 
let produtosCache = {};

// Elementos das Tabelas (CRÍTICO: Garantir que os IDs existam no HTML)
const listaClientesBody = document.getElementById('lista-clientes-body');
const listaProdutosBody = document.getElementById('lista-produtos-body');
const listaVendasBody = document.getElementById('lista-vendas-body');
// NOVOS ELEMENTOS
const listaCaixaBody = document.getElementById('lista-caixa-body'); 
const listaInsumosBody = document.getElementById('lista-insumos-body'); 

// Elementos dos Modais
const modalEdicao = document.getElementById('modal-edicao');
const edicaoForm = document.getElementById('edicao-form');
const edicaoCampos = document.getElementById('edicao-campos');
const edicaoId = document.getElementById('edicao-id');
const edicaoColecao = document.getElementById('edicao-colecao');

const modalCadastro = document.getElementById('modal-cadastro');
const modalCadastroTitulo = document.getElementById('modal-cadastro-titulo');
const modalCadastroBody = document.getElementById('modal-cadastro-body');
const modalCadastroSalvarBtn = document.getElementById('modal-cadastro-salvar');

let tipoCadastroAtual = '';

// =========================================================
// 1.1. GERENCIAMENTO DE NAVEGAÇÃO
// =========================================================

function mostrarSecao(targetId) {
    document.querySelectorAll('.page-section').forEach(section => {
        section.classList.remove('active-section');
    });
    document.getElementById(targetId).classList.add('active-section');
    
    // Atualiza o título do header
    topHeader.querySelector('h2').textContent = document.querySelector(`[data-target="${targetId}"]`).textContent.replace(' ','').slice(1);
    
    // Atualiza o item de navegação ativo
    navItems.forEach(item => item.classList.remove('active'));
    document.querySelector(`[data-target="${targetId}"]`).classList.add('active');
}

navItems.forEach(item => {
    item.addEventListener('click', () => {
        const target = item.getAttribute('data-target');
        mostrarSecao(target);
    });
});

// =========================================================
// 1.2. LISTENERS FIREBASE (Carrega e mantém os dados atualizados)
// =========================================================

function iniciarListenersFirestore() {
    // Clientes
    db.collection('clientes').orderBy('nome').onSnapshot(snapshot => {
        const clientes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderizarClientes(clientes);
    });

    // Produtos
    db.collection('produtos').orderBy('nome').onSnapshot(snapshot => {
        const produtos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderizarProdutos(produtos);
    });
    
    // Vendas
    db.collection('vendas').orderBy('criadoEm', 'desc').onSnapshot(snapshot => {
        const vendas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderizarVendas(vendas);
    });

    // Fluxo de Caixa
    db.collection('fluxo').orderBy('criadoEm', 'desc').onSnapshot(snapshot => {
        const fluxo = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderizarFluxo(fluxo);
    });

    // Insumos
    db.collection('insumos').orderBy('nome').onSnapshot(snapshot => {
        const insumos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderizarInsumos(insumos);
    });
}


// =========================================================
// 1.5. FUNÇÕES GERAIS DO MODAL DE EDIÇÃO (Update)
// =========================================================

function fecharModalEdicao() {
    modalEdicao.style.display = 'none';
    edicaoCampos.innerHTML = ''; 
}

async function salvarEdicaoGenerica(e) {
    e.preventDefault();
    
    const id = edicaoId.value;
    const colecao = edicaoColecao.value;
    const dadosAtualizados = {};
    
    const inputs = edicaoCampos.querySelectorAll('input, select');
    inputs.forEach(input => {
        let valor = input.value;
        if (input.type === 'number') {
            valor = parseFloat(valor);
        }
        dadosAtualizados[input.id.replace('edicao-', '')] = valor; 
    });

    try {
        dadosAtualizados.atualizadoEm = firebase.firestore.FieldValue.serverTimestamp();
        await db.collection(colecao).doc(id).update(dadosAtualizados);
        
        alert(`${colecao.slice(0, -1)} atualizado com sucesso!`);
        fecharModalEdicao();
        
    } catch (error) {
        console.error(`Erro ao atualizar ${colecao}: `, error);
        alert(`Erro ao atualizar. Verifique o console.`);
    }
}

if (edicaoForm) {
    edicaoForm.addEventListener('submit', salvarEdicaoGenerica);
}


// =========================================================
// 1.6. FUNÇÕES GERAIS DO MODAL DE CADASTRO (Novo)
// =========================================================

function fecharModalCadastro() {
    modalCadastro.style.display = 'none';
    modalCadastroBody.innerHTML = ''; 
    tipoCadastroAtual = '';
}

function abrirModalCadastro(tipo) {
    tipoCadastroAtual = tipo;
    modalCadastroBody.innerHTML = ''; 

    let titulo = '';
    let formHTML = '';

    // Define o conteúdo do formulário baseado no tipo
    switch(tipo) {
        case 'cliente':
            titulo = 'Novo Cliente';
            formHTML = `
                <form id="novo-cliente-form">
                    <div><label for="nome">Nome:</label><input type="text" id="nome" required></div>
                    <div><label for="telefone">Telefone:</label><input type="text" id="telefone" required></div>
                    <div><label for="endereco">Endereço:</label><input type="text" id="endereco"></div>
                    <div>
                        <label for="statusPagamento">Status Pagamento (Texto Livre):</label>
                        <input type="text" id="statusPagamento" placeholder="Ex: Pago, Pendente, 10/05/2026">
                    </div>
                </form>
            `;
            break;

        case 'produto':
            titulo = 'Novo Produto';
            formHTML = `
                <form id="novo-produto-form">
                    <div><label for="nome-produto">Nome:</label><input type="text" id="nome-produto" required></div>
                    <div><label for="codigo">Código:</label><input type="text" id="codigo" placeholder="Ex: GTIN, SKU, Código interno"></div>
                    <div><label for="unidade">Unidade:</label><input type="text" id="unidade" placeholder="Ex: KG, Unidade, Litro"></div>
                    <div><label for="vencimento">Vencimento:</label><input type="date" id="vencimento"></div>
                    <div><label for="valor-pago">Valor Pago (Custo):</label><input type="number" id="valor-pago" step="0.01" required></div>
                    <div><label for="fornecedor">Fornecedor:</label><input type="text" id="fornecedor"></div>
                    <div><label for="data-compra">Data da Compra:</label><input type="date" id="data-compra"></div>
                    <div><label for="forma-pagamento-compra">Forma de Pagamento:</label><input type="text" id="forma-pagamento-compra"></div>
                </form>
            `;
            break;

        case 'venda':
            titulo = 'Registrar Nova Venda';
            // Estrutura do formulário de venda com suporte a múltiplos produtos
            formHTML = `
                <form id="nova-venda-form">
                    <!-- Campos gerais da venda -->
                    <div>
                        <label for="cliente-venda-modal">Cliente:</label>
                        <select id="cliente-venda-modal" required></select>
                    </div>
                    <div><label for="data-venda">Data da Venda:</label><input type="date" id="data-venda" required></div>
                    <div><label for="forma-pagamento-venda">Forma de Pagamento:</label><input type="text" id="forma-pagamento-venda" required></div>
                    
                    <!-- Seção de Produtos -->
                    <hr style="margin: 20px 0;">
                    <h4>Produtos da Venda</h4>
                    <div id="produtos-venda-container">
                        <!-- Linhas de produto serão adicionadas aqui dinamicamente -->
                    </div>
                    <button type="button" class="add-btn" onclick="adicionarLinhaProdutoVenda()" style="margin-top: 10px; width: auto; padding: 8px 12px;">+ Adicionar Produto</button>
                    
                    <!-- Total da Venda -->
                    <hr style="margin: 20px 0;">
                    <div style="text-align: right; font-size: 1.2em; font-weight: bold;">
                        <label>Valor Total da Venda: R$ </label>
                        <span id="valor-total-venda-display">0.00</span>
                    </div>
                </form>
            `;

            // Atraso para garantir que o HTML foi inserido no DOM
            setTimeout(() => {
                const modalClienteVenda = document.getElementById('cliente-venda-modal');
                if (modalClienteVenda) {
                    modalClienteVenda.innerHTML = selectClienteVenda.innerHTML;
                }

                // Adiciona a primeira linha de produto automaticamente
                adicionarLinhaProdutoVenda();

                // Define a data de hoje como padrão
                const dataInput = document.getElementById('data-venda');
                if (dataInput) {
                    dataInput.value = new Date().toISOString().split('T')[0];
                }

                // Adiciona o listener para recalcular o total
                const form = document.getElementById('nova-venda-form');
                if(form) {
                    form.addEventListener('change', (event) => {
                        if (event.target.classList.contains('produto-item-input')) {
                            calcularTotalVenda();
                        }
                    });
                }
            }, 100); 

            break;

        case 'recebimento':
            titulo = 'Nova Entrada (Recebimento)';
            formHTML = `
                    <form id="novo-recebimento-form">
                    <div><label for="valor-recebido">Valor Recebido:</label><input type="number" id="valor-recebido" step="0.01" required></div>
                    <div><label for="origem">Origem (Ex: Venda, Cliente, Outros):</label><input type="text" id="origem" required></div>
                    <div><label for="data-recebimento">Data:</label><input type="date" id="data-recebimento" required></div>
                    <div><label for="descricao-recebimento">Descrição:</label><input type="text" id="descricao-recebimento"></div>
                </form>
            `;
            break;
            
        case 'despesa':
            titulo = 'Nova Saída (Despesa)';
            formHTML = `
                    <form id="nova-despesa-form">
                    <div><label for="valor-despesa">Valor da Despesa:</label><input type="number" id="valor-despesa" step="0.01" required></div>
                    <div><label for="destino">Destino (Ex: Fornecedor, Aluguel, Salário):</label><input type="text" id="destino" required></div>
                    <div><label for="data-despesa">Data:</label><input type="date" id="data-despesa" required></div>
                    <div><label for="descricao-despesa">Descrição:</label><input type="text" id="descricao-despesa"></div>
                </form>
            `;
            break;

        case 'insumo':
            titulo = 'Novo Insumo';
            formHTML = `
                <form id="novo-insumo-form">
                    <div><label for="nome-insumo">Nome:</label><input type="text" id="nome-insumo" required></div>
                    <div><label for="quantidade-insumo">Quantidade:</label><input type="number" id="quantidade-insumo" step="0.01" required></div>
                    <div><label for="unidade-insumo">Unidade:</label><input type="text" id="unidade-insumo" placeholder="Ex: KG, Litro, Grama"></div>
                    <div><label for="custo-insumo">Custo Total:</label><input type="number" id="custo-insumo" step="0.01" required></div>
                </form>
            `;
            break;
        default:
            titulo = 'Novo Item';
            formHTML = '<p>Tipo de cadastro não reconhecido.</p>';
    }

    modalCadastroTitulo.textContent = titulo;
    modalCadastroBody.innerHTML = formHTML;
    modalCadastro.style.display = 'block';
}

// Função genérica de Salvamento de Novo Item
modalCadastroSalvarBtn.addEventListener('click', async () => {
    let colecao = tipoCadastroAtual + (tipoCadastroAtual === 'cliente' || tipoCadastroAtual === 'produto' || tipoCadastroAtual === 'insumo' ? 's' : 's'); 
    
    if (tipoCadastroAtual === 'recebimento') colecao = 'fluxo'; // Salva em 'fluxo'
    if (tipoCadastroAtual === 'despesa') colecao = 'fluxo'; // Salva em 'fluxo'
    if (tipoCadastroAtual === 'venda') colecao = 'vendas';

    const formElement = modalCadastroBody.querySelector('form');
    
    if (!formElement || !formElement.checkValidity()) {
        alert("Por favor, preencha todos os campos obrigatórios corretamente.");
        return;
    }

    let novoItem = {};
    let isVenda = false;
    let isFluxo = false;

    // --- COLETANDO DADOS ESPECÍFICOS ---
    if (tipoCadastroAtual === 'cliente') {
        novoItem = {
            nome: formElement.querySelector('#nome').value,
            telefone: formElement.querySelector('#telefone').value,
            endereco: formElement.querySelector('#endereco').value,
            statusPagamento: formElement.querySelector('#statusPagamento').value,
        };
        if (!novoItem.nome || !novoItem.telefone) {
             alert("Nome e Telefone são obrigatórios."); return;
        }

    } else if (tipoCadastroAtual === 'produto') {
        novoItem = {
            nome: formElement.querySelector('#nome-produto').value,
            codigo: formElement.querySelector('#codigo').value,
            unidade: formElement.querySelector('#unidade').value,
            vencimento: formElement.querySelector('#vencimento').value,
            valorPago: parseFloat(formElement.querySelector('#valor-pago').value),
            fornecedor: formElement.querySelector('#fornecedor').value,
            dataCompra: formElement.querySelector('#data-compra').value,
            formaPagamentoCompra: formElement.querySelector('#forma-pagamento-compra').value,
        };
        if (!novoItem.nome || isNaN(novoItem.valorPago)) {
             alert("Nome e Valor Pago são obrigatórios."); return;
        }
    
    } else if (tipoCadastroAtual === 'venda') {
        isVenda = true; 
        const produtosVendidos = [];
        const produtoRows = formElement.querySelectorAll('.produto-venda-linha');
        
        produtoRows.forEach(row => {
            const produtoId = row.querySelector('.produto-select').value;
            const quantidade = parseFloat(row.querySelector('.quantidade-input').value);
            const precoUnitario = parseFloat(row.querySelector('.preco-input').value);
            if (produtoId && !isNaN(quantidade) && !isNaN(precoUnitario)) {
                produtosVendidos.push({ produtoId, quantidade, precoUnitario });
            }
        });

        novoItem = {
            clienteId: formElement.querySelector('#cliente-venda-modal').value,
            produtos: produtosVendidos, // Array de produtos
            dataVenda: formElement.querySelector('#data-venda').value,
            formaPagamento: formElement.querySelector('#forma-pagamento-venda').value, 
        };
    
    } else if (tipoCadastroAtual === 'recebimento' || tipoCadastroAtual === 'despesa') {
        isFluxo = true;
        novoItem = {
            tipo: tipoCadastroAtual === 'recebimento' ? 'Entrada' : 'Saída',
            valor: parseFloat(formElement.querySelector(tipoCadastroAtual === 'recebimento' ? '#valor-recebido' : '#valor-despesa').value),
            origem: tipoCadastroAtual === 'recebimento' ? formElement.querySelector('#origem').value : '',
            destino: tipoCadastroAtual === 'despesa' ? formElement.querySelector('#destino').value : '',
            data: formElement.querySelector(tipoCadastroAtual === 'recebimento' ? '#data-recebimento' : '#data-despesa').value,
            descricao: formElement.querySelector(tipoCadastroAtual === 'recebimento' ? '#descricao-recebimento' : '#descricao-despesa').value,
        };
        if (isNaN(novoItem.valor) || (!novoItem.origem && !novoItem.destino)) {
            alert("Valor e origem/destino são obrigatórios."); return;
        }
        
    } else if (tipoCadastroAtual === 'insumo') {
        novoItem = {
            nome: formElement.querySelector('#nome-insumo').value,
            quantidade: parseFloat(formElement.querySelector('#quantidade-insumo').value),
            unidade: formElement.querySelector('#unidade-insumo').value,
            custo: parseFloat(formElement.querySelector('#custo-insumo').value),
        };
           if (!novoItem.nome || isNaN(novoItem.custo)) {
             alert("Nome e Custo são obrigatórios para Insumo."); return;
           }
    } else {
        alert("Erro interno: Tipo de cadastro desconhecido.");
        return;
    }
    
    // --- SALVANDO NO FIREBASE ---
    try {
        if (isVenda) {
            await salvarVenda(novoItem);
        } else if (isFluxo) {
            // Salva na coleção 'fluxo'
            await db.collection('fluxo').add({...novoItem, criadoEm: firebase.firestore.FieldValue.serverTimestamp()});
            alert(`${novoItem.tipo} registrado com sucesso!`);
        } else {
            // Salva em 'clientes', 'produtos' ou 'insumos'
            novoItem.criadoEm = firebase.firestore.FieldValue.serverTimestamp();
            await db.collection(colecao).add(novoItem);
            alert(`${colecao.slice(0, -1)} salvo com sucesso!`);
        }

        fecharModalCadastro();
        
    } catch (error) {
        console.error(`Erro ao salvar ${tipoCadastroAtual}: `, error);
        alert(`Erro ao salvar. Verifique o console.`);
    }
});


// =========================================================
// 2. FUNÇÕES: CLIENTES (CRUD)
// =========================================================

function renderizarClientes(clientes) {
    if (!listaClientesBody) {
        console.error("Elemento 'lista-clientes-body' não encontrado no DOM.");
        return; 
    }
    listaClientesBody.innerHTML = '';
    selectClienteVenda.innerHTML = '<option value="">Selecione um Cliente</option>'; 
    
    // ATUALIZA O CACHE DE CLIENTES
    clientesCache = {};

    if (clientes.length === 0) {
        listaClientesBody.innerHTML = `<tr><td colspan="5">Nenhum cliente cadastrado.</td></tr>`;
    }

    clientes.forEach(cliente => {
        // Popula o cache
        clientesCache[cliente.id] = cliente.nome;
        
        const clienteString = JSON.stringify({
            id: cliente.id, 
            nome: cliente.nome, 
            telefone: cliente.telefone, 
            endereco: cliente.endereco || '', 
            statusPagamento: cliente.statusPagamento || '' 
        }).replace(/"/g, '&quot;'); 

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${cliente.nome}</td>
            <td>${cliente.telefone}</td>
            <td>${cliente.endereco || 'N/A'}</td>
            <td>${cliente.statusPagamento || 'N/A'}</td>
            <td>
                <button class="tabela-acao-btn" onclick='abrirModalEdicaoCliente(${clienteString})'>Editar</button>
                <button class="tabela-acao-btn delete-btn" onclick="deletarCliente('${cliente.id}')">Excluir</button>
            </td>
        `;
        listaClientesBody.appendChild(tr);

        const option = document.createElement('option');
        option.value = cliente.id;
        option.textContent = cliente.nome;
        selectClienteVenda.appendChild(option);
    });
    
    // Após atualizar os clientes, força a re-renderização das vendas
    // para atualizar os nomes se a seção de vendas estiver aberta
    if (document.getElementById('vendas-section').classList.contains('active-section')) {
        db.collection('vendas').orderBy('criadoEm', 'desc')
            .get()
            .then(snapshot => {
                renderizarVendas(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            });
    }
}

async function deletarCliente(id) {
    if (confirm('Tem certeza que deseja excluir este cliente?')) {
        try {
            await db.collection('clientes').doc(id).delete();
        } catch (error) {
            console.error("Erro ao excluir cliente: ", error);
            alert("Erro ao excluir cliente. Verifique o console.");
        }
    }
}

function abrirModalEdicaoCliente(clienteData) {
    const modalTitulo = document.getElementById('modal-titulo');
    modalTitulo.textContent = 'Editar Cliente';
    edicaoId.value = clienteData.id;
    edicaoColecao.value = 'clientes';
    
    edicaoCampos.innerHTML = `
        <div>
            <label for="edicao-nome">Nome:</label>
            <input type="text" id="edicao-nome" value="${clienteData.nome}" required>
        </div>
        <div>
            <label for="edicao-telefone">Telefone:</label>
            <input type="text" id="edicao-telefone" value="${clienteData.telefone}" required>
        </div>
        <div>
            <label for="edicao-endereco">Endereço:</label>
            <input type="text" id="edicao-endereco" value="${clienteData.endereco}">
        </div>
        <div>
            <label for="edicao-statusPagamento">Status Pagamento (Texto Livre):</label>
            <input type="text" id="edicao-statusPagamento" value="${clienteData.statusPagamento || ''}">
        </div>
    `;
    
    modalEdicao.style.display = 'block';
}


// =========================================================
// 3. FUNÇÕES: PRODUTOS (CRUD)
// =========================================================

function renderizarProdutos(produtos) {
    if (!listaProdutosBody) {
        console.error("Elemento 'lista-produtos-body' não encontrado no DOM.");
        return; 
    }
    listaProdutosBody.innerHTML = '';
    selectProdutoVenda.innerHTML = '<option value="">Selecione um Produto</option>'; 
    
    // ATUALIZA O CACHE DE PRODUTOS
    produtosCache = {};

    if (produtos.length === 0) {
        listaProdutosBody.innerHTML = `<tr><td colspan="9">Nenhum produto cadastrado.</td></tr>`;
    }

    produtos.forEach(produto => {
        // Popula o cache
        produtosCache[produto.id] = produto.nome;
        
        const tr = document.createElement('tr');
        
        const produtoData = {
            id: produto.id,
            nome: produto.nome,
            codigo: produto.codigo || '',
            unidade: produto.unidade || '',
            vencimento: produto.vencimento || '',
            valorPago: produto.valorPago || 0,
            fornecedor: produto.fornecedor || '',
            dataCompra: produto.dataCompra || '',
            formaPagamentoCompra: produto.formaPagamentoCompra || ''
        };
        const produtoString = JSON.stringify(produtoData).replace(/"/g, '&quot;');
        
        tr.innerHTML = `
            <td>${produto.nome}</td>
            <td>${produto.codigo || 'N/A'}</td> 
            <td>${produto.unidade || 'N/A'}</td>
            <td>${produto.vencimento || 'N/A'}</td>
            <td>R$ ${produto.valorPago ? produto.valorPago.toFixed(2) : '0.00'}</td>
            <td>${produto.fornecedor || 'N/A'}</td>
            <td>${produto.dataCompra || 'N/A'}</td> 
            <td>${produto.formaPagamentoCompra || 'N/A'}</td> 
            <td>
                <button class="tabela-acao-btn" onclick='abrirModalEdicaoProduto(${produtoString})'>Editar</button>
                <button class="tabela-acao-btn delete-btn" onclick="deletarProduto('${produto.id}')">Excluir</button>
            </td>
        `;
        listaProdutosBody.appendChild(tr);

        const option = document.createElement('option');
        option.value = produto.id;
        option.textContent = `${produto.nome} (Custo: R$ ${produto.valorPago ? produto.valorPago.toFixed(2) : '0.00'})`;
        selectProdutoVenda.appendChild(option);
    });
    
    // Após atualizar os produtos, força a re-renderização das vendas
    // para atualizar os nomes se a seção de vendas estiver aberta
    if (document.getElementById('vendas-section').classList.contains('active-section')) {
        db.collection('vendas').orderBy('criadoEm', 'desc')
            .get()
            .then(snapshot => {
                renderizarVendas(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            });
    }
}

async function deletarProduto(id) {
    if (confirm('Tem certeza que deseja excluir este produto?')) {
        try {
            await db.collection('produtos').doc(id).delete();
            alert('Produto excluído com sucesso!');
        } catch (error) {
            console.error("Erro ao excluir produto: ", error);
            alert("Erro ao excluir produto. Verifique o console.");
        }
    }
}

function abrirModalEdicaoProduto(produtoData) {
    const modalTitulo = document.getElementById('modal-titulo'); 
    modalTitulo.textContent = 'Editar Produto';
    edicaoId.value = produtoData.id;
    edicaoColecao.value = 'produtos';

    const vencimento = produtoData.vencimento === 'N/A' ? '' : produtoData.vencimento;
    const dataCompra = produtoData.dataCompra === 'N/A' ? '' : produtoData.dataCompra;
    
    edicaoCampos.innerHTML = `
        <div>
            <label for="edicao-nome">Nome:</label>
            <input type="text" id="edicao-nome" value="${produtoData.nome}" required>
        </div>
        <div>
            <label for="edicao-codigo">Código:</label>
            <input type="text" id="edicao-codigo" value="${produtoData.codigo || ''}">
        </div>
        <div>
            <label for="edicao-unidade">Unidade:</label>
            <input type="text" id="edicao-unidade" value="${produtoData.unidade}">
        </div>
        <div>
            <label for="edicao-vencimento">Vencimento:</label>
            <input type="date" id="edicao-vencimento" value="${vencimento}">
        </div>
        <div>
            <label for="edicao-valorPago">Valor Pago (Custo):</label>
            <input type="number" id="edicao-valorPago" step="0.01" value="${produtoData.valorPago}" required>
        </div>
        <div>
            <label for="edicao-fornecedor">Fornecedor:</label>
            <input type="text" id="edicao-fornecedor" value="${produtoData.fornecedor}">
        </div>
        <div>
            <label for="edicao-dataCompra">Data da Compra:</label>
            <input type="date" id="edicao-dataCompra" value="${dataCompra}">
        </div>
        <div>
            <label for="edicao-formaPagamentoCompra">Forma de Pagamento:</label>
            <input type="text" id="edicao-formaPagamentoCompra" value="${produtoData.formaPagamentoCompra || ''}">
        </div>
    `;
    
    modalEdicao.style.display = 'block';
}


// =========================================================
// 4. FUNÇÕES: VENDAS (Implementada)
// =========================================================

async function salvarVenda(vendaData) {
    try {
        const novaVenda = {
            ...vendaData,
            // Calcula o valor total somando o (preço * quantidade) de cada produto
            valorTotal: vendaData.produtos.reduce((total, produto) => {
                return total + (produto.quantidade * produto.precoUnitario);
            }, 0),
            criadoEm: firebase.firestore.FieldValue.serverTimestamp()
        };

        // Validação final
        await db.collection('vendas').add(novaVenda);
        alert('Venda registrada com sucesso!');

    } catch (error) {
        console.error("Erro ao registrar venda: ", error);
        throw new Error("Falha ao salvar a venda."); 
    }
}

function renderizarVendas(vendas) {
    if (!listaVendasBody) {
        console.error("Elemento 'lista-vendas-body' não encontrado no DOM.");
        return; 
    }
    listaVendasBody.innerHTML = '';

    if (vendas.length === 0) {
        listaVendasBody.innerHTML = `<tr><td colspan="8">Nenhuma venda registrada.</td></tr>`;
        return;
    }
    
    vendas.forEach(venda => {
        // BUSCA OS NOMES NO CACHE
        const nomeCliente = clientesCache[venda.clienteId] || `ID: ${venda.clienteId.substring(0, 5)}...`;
        
        // Mapeia os produtos da venda para exibir seus nomes
        const produtosHtml = venda.produtos && venda.produtos.length > 0
            ? venda.produtos.map(p => {
                const nomeProduto = produtosCache[p.produtoId] || `ID: ${p.produtoId.substring(0, 5)}...`;
                return `<li>${p.quantidade}x ${nomeProduto} (R$ ${p.precoUnitario.toFixed(2)})</li>`;
              }).join('')
            : '<li>Nenhum produto informado</li>';

        // Na tabela, a coluna de preço unitário foi removida para dar espaço à lista de produtos
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${nomeCliente}</td>
            <td><ul style="padding-left: 15px; margin: 0;">${produtosHtml}</ul></td>
            <td>${venda.produtos ? venda.produtos.reduce((acc, p) => acc + p.quantidade, 0) : 0}</td>
            <td>R$ ${venda.valorTotal ? venda.valorTotal.toFixed(2) : '0.00'}</td>
            <td>${venda.dataVenda || 'N/A'}</td>
            <td>${venda.formaPagamento || 'N/A'}</td> 
            <td>
                <button class="tabela-acao-btn delete-btn" onclick="deletarVenda('${venda.id}')">Excluir</button>
            </td>
        `;
        listaVendasBody.appendChild(tr);
    });
}

async function deletarVenda(id) {
    if (confirm('Tem certeza que deseja excluir esta venda?')) {
        try {
            await db.collection('vendas').doc(id).delete();
            alert('Venda excluída com sucesso!');
        } catch (error) {
            console.error("Erro ao excluir venda: ", error);
            alert("Erro ao excluir venda. Verifique o console.");
        }
    }
}

// =========================================================
// 4.1 FUNÇÕES AUXILIARES PARA O MODAL DE VENDAS
// =========================================================

/**
 * Adiciona uma nova linha de produto ao formulário de venda.
 */
function adicionarLinhaProdutoVenda() {
    const container = document.getElementById('produtos-venda-container');
    if (!container) return;

    const linhaDiv = document.createElement('div');
    linhaDiv.className = 'produto-venda-linha';
    linhaDiv.style.display = 'flex';
    linhaDiv.style.gap = '10px';
    linhaDiv.style.marginBottom = '10px';

    linhaDiv.innerHTML = `
        <select class="produto-select produto-item-input" style="flex: 3;" required>${selectProdutoVenda.innerHTML}</select>
        <input type="number" class="quantidade-input produto-item-input" placeholder="Qtd" value="1" step="1" style="flex: 1;" required>
        <input type="number" class="preco-input produto-item-input" placeholder="Preço Unit." step="0.01" style="flex: 1;" required>
        <button type="button" onclick="this.parentElement.remove(); calcularTotalVenda();" class="delete-btn" style="padding: 5px 10px;">X</button>
    `;
    container.appendChild(linhaDiv);
}

/**
 * Calcula e exibe o valor total da venda com base nos produtos inseridos.
 */
function calcularTotalVenda() {
    const displayTotal = document.getElementById('valor-total-venda-display');
    if (!displayTotal) return;

    let total = 0;
    const produtoRows = document.querySelectorAll('.produto-venda-linha');
    produtoRows.forEach(row => {
        const quantidade = parseFloat(row.querySelector('.quantidade-input').value) || 0;
        const preco = parseFloat(row.querySelector('.preco-input').value) || 0;
        total += quantidade * preco;
    });

    displayTotal.textContent = total.toFixed(2);
}


// =========================================================
// 5. FUNÇÕES: FLUXO DE CAIXA (NOVO)
// =========================================================

function renderizarFluxo(itens) {
    if (!listaCaixaBody) {
        console.warn("Elemento 'lista-caixa-body' não encontrado. Fluxo de Caixa não será exibido.");
        return; 
    }
    
    listaCaixaBody.innerHTML = '';
    
    if (itens.length === 0) {
        listaCaixaBody.innerHTML = `<tr><td colspan="6">Nenhuma movimentação de caixa registrada.</td></tr>`;
        return;
    }
    
    // ORDENA POR DATA DE FORMA DESCENDENTE (mais recente primeiro)
    itens.sort((a, b) => {
        const dataA = a.data ? new Date(a.data) : (a.criadoEm ? new Date(a.criadoEm.seconds * 1000) : new Date(0));
        const dataB = b.data ? new Date(b.data) : (b.criadoEm ? new Date(b.criadoEm.seconds * 1000) : new Date(0));
        return dataB - dataA;
    });

    itens.forEach(item => {
        const tipoClass = item.tipo === 'Entrada' ? 'entrada' : 'saida'; // Use no CSS
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.data || 'N/A'}</td>
            <td class="${tipoClass}">${item.tipo}</td>
            <td>${item.origem || item.destino}</td>
            <td>R$ ${item.valor ? item.valor.toFixed(2) : '0.00'}</td>
            <td>${item.descricao || 'N/A'}</td>
            <td>
                <button class="tabela-acao-btn delete-btn" onclick="deletarFluxoItem('${item.id}')">Excluir</button>
            </td>
        `;
        listaCaixaBody.appendChild(tr);
    });
}

async function deletarFluxoItem(id) {
        if (confirm('Tem certeza que deseja excluir esta movimentação?')) {
          try {
                await db.collection('fluxo').doc(id).delete();
                alert('Item de fluxo excluído com sucesso!');
          } catch (error) {
                console.error("Erro ao excluir item de fluxo: ", error);
                alert("Erro ao excluir. Verifique o console.");
          }
       }
}


// =========================================================
// 6. FUNÇÕES: INSUMOS (NOVO)
// =========================================================

function renderizarInsumos(insumos) {
    if (!listaInsumosBody) {
        console.warn("Elemento 'lista-insumos-body' não encontrado. Inventário de Insumos não será exibido.");
        return; 
    }

    listaInsumosBody.innerHTML = '';

    if (insumos.length === 0) {
        listaInsumosBody.innerHTML = `<tr><td colspan="5">Nenhum insumo cadastrado.</td></tr>`;
        return;
    }
    
    insumos.forEach(insumo => {
        const insumoData = {
            id: insumo.id,
            nome: insumo.nome,
            quantidade: insumo.quantidade || 0,
            unidade: insumo.unidade || '',
            custo: insumo.custo || 0,
        };
        const insumoString = JSON.stringify(insumoData).replace(/"/g, '&quot;');
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${insumo.nome}</td>
            <td>${insumo.quantidade} ${insumo.unidade || 'Un'}</td>
            <td>R$ ${insumo.custo ? insumo.custo.toFixed(2) : '0.00'}</td>
            <td>${insumo.criadoEm ? new Date(insumo.criadoEm.seconds * 1000).toLocaleDateString() : 'N/A'}</td>
            <td>
                <button class="tabela-acao-btn" onclick='abrirModalEdicaoInsumo(${insumoString})'>Editar</button>
                <button class="tabela-acao-btn delete-btn" onclick="deletarInsumo('${insumo.id}')">Excluir</button>
            </td>
        `;
        listaInsumosBody.appendChild(tr);
    });
}

function abrirModalEdicaoInsumo(insumoData) {
    const modalTitulo = document.getElementById('modal-titulo');
    modalTitulo.textContent = 'Editar Insumo';
    edicaoId.value = insumoData.id;
    edicaoColecao.value = 'insumos';
    
    edicaoCampos.innerHTML = `
        <div>
            <label for="edicao-nome">Nome:</label>
            <input type="text" id="edicao-nome" value="${insumoData.nome}" required>
        </div>
        <div>
            <label for="edicao-quantidade">Quantidade:</label>
            <input type="number" id="edicao-quantidade" step="0.01" value="${insumoData.quantidade}" required>
        </div>
        <div>
            <label for="edicao-unidade">Unidade:</label>
            <input type="text" id="edicao-unidade" value="${insumoData.unidade || ''}">
        </div>
        <div>
            <label for="edicao-custo">Custo Total:</label>
            <input type="number" id="edicao-custo" step="0.01" value="${insumoData.custo}" required>
        </div>
    `;
    
    modalEdicao.style.display = 'block';
}

async function deletarInsumo(id) {
    if (confirm('Tem certeza que deseja excluir este insumo?')) {
        try {
            await db.collection('insumos').doc(id).delete();
            alert('Insumo excluído com sucesso!');
        } catch (error) {
            console.error("Erro ao excluir insumo: ", error);
            alert("Erro ao excluir insumo. Verifique o console.");
        }
    }
}   );
    return;
  }

  listaCaixaBody.innerHTML = "";

  if (itens.length === 0) {
    listaCaixaBody.innerHTML = `<tr><td colspan="6">Nenhuma movimentação de caixa registrada.</td></tr>`;
    return;
  }

  // ORDENA POR DATA DE FORMA DESCENDENTE (mais recente primeiro)
  itens.sort((a, b) => {
    const dataA = a.data
      ? new Date(a.data)
      : a.criadoEm
      ? new Date(a.criadoEm.seconds * 1000)
      : new Date(0);
    const dataB = b.data
      ? new Date(b.data)
      : b.criadoEm
      ? new Date(b.criadoEm.seconds * 1000)
      : new Date(0);
    return dataB - dataA;
  });

  itens.forEach((item) => {
    const tipoClass = item.tipo === "Entrada" ? "entrada" : "saida"; // Use no CSS
    const tr = document.createElement("tr");
    tr.innerHTML = `
            <td>${item.data || "N/A"}</td>
            <td class="${tipoClass}">${item.tipo}</td>
            <td>${item.origem || item.destino}</td>
            <td>R$ ${item.valor ? item.valor.toFixed(2) : "0.00"}</td>
            <td>${item.descricao || "N/A"}</td>
            <td>
                <button class="tabela-acao-btn delete-btn" onclick="deletarFluxoItem('${
                  item.id
                }')">Excluir</button>
            </td>
        `;
    listaCaixaBody.appendChild(tr);
  });
}

async function deletarFluxoItem(id) {
  if (confirm("Tem certeza que deseja excluir esta movimentação?")) {
    try {
      await db.collection("fluxo").doc(id).delete();
      alert("Item de fluxo excluído com sucesso!");
    } catch (error) {
      console.error("Erro ao excluir item de fluxo: ", error);
      alert("Erro ao excluir. Verifique o console.");
    }
  }
}

// =========================================================
// 6. FUNÇÕES: INSUMOS (NOVO)
// =========================================================

function renderizarInsumos(insumos) {
  if (!listaInsumosBody) {
    console.warn(
      "Elemento 'lista-insumos-body' não encontrado. Inventário de Insumos não será exibido."
    );
    return;
  }

  listaInsumosBody.innerHTML = "";

  if (insumos.length === 0) {
    listaInsumosBody.innerHTML = `<tr><td colspan="5">Nenhum insumo cadastrado.</td></tr>`;
    return;
  }

  insumos.forEach((insumo) => {
    const insumoData = {
      id: insumo.id,
      nome: insumo.nome,
      quantidade: insumo.quantidade || 0,
      unidade: insumo.unidade || "",
      custo: insumo.custo || 0,
    };
    const insumoString = JSON.stringify(insumoData).replace(/"/g, "&quot;");

    const tr = document.createElement("tr");
    tr.innerHTML = `
            <td>${insumo.nome}</td>
            <td>${insumo.quantidade} ${insumo.unidade || "Un"}</td>
            <td>R$ ${insumo.custo ? insumo.custo.toFixed(2) : "0.00"}</td>
            <td>${
              insumo.criadoEm
                ? new Date(insumo.criadoEm.seconds * 1000).toLocaleDateString()
                : "N/A"
            }</td>
            <td>
                <button class="tabela-acao-btn" onclick='abrirModalEdicaoInsumo(${insumoString})'>Editar</button>
                <button class="tabela-acao-btn delete-btn" onclick="deletarInsumo('${
                  insumo.id
                }')">Excluir</button>
            </td>
        `;
    listaInsumosBody.appendChild(tr);
  });
}

function abrirModalEdicaoInsumo(insumoData) {
  const modalTitulo = document.getElementById("modal-titulo");
  modalTitulo.textContent = "Editar Insumo";
  edicaoId.value = insumoData.id;
  edicaoColecao.value = "insumos";

  edicaoCampos.innerHTML = `
        <div>
            <label for="edicao-nome">Nome:</label>
            <input type="text" id="edicao-nome" value="${
              insumoData.nome
            }" required>
        </div>
        <div>
            <label for="edicao-quantidade">Quantidade:</label>
            <input type="number" id="edicao-quantidade" step="0.01" value="${
              insumoData.quantidade
            }" required>
        </div>
        <div>
            <label for="edicao-unidade">Unidade:</label>
            <input type="text" id="edicao-unidade" value="${
              insumoData.unidade || ""
            }">
        </div>
        <div>
            <label for="edicao-custo">Custo Total:</label>
            <input type="number" id="edicao-custo" step="0.01" value="${
              insumoData.custo
            }" required>
        </div>
    `;

  modalEdicao.style.display = "block";
}

async function deletarInsumo(id) {
  if (confirm("Tem certeza que deseja excluir este insumo?")) {
    try {
      await db.collection("insumos").doc(id).delete();
      alert("Insumo excluído com sucesso!");
    } catch (error) {
      console.error("Erro ao excluir insumo: ", error);
      alert("Erro ao excluir insumo. Verifique o console.");
    }
  }
}
