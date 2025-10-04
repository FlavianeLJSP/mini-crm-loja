// =========================================================
// 1. Variáveis Globais e Inicialização
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
            formHTML = `
                <form id="nova-venda-form">
                    <div>
                        <label for="cliente-venda-modal">Cliente:</label>
                        <select id="cliente-venda-modal" required>
                            <option value="">Carregando clientes...</option>
                        </select>
                    </div>
                    <div>
                        <label for="produto-venda-modal">Produto Vendido:</label>
                        <select id="produto-venda-modal" required>
                            <option value="">Carregando produtos...</option>
                        </select>
                    </div>
                    <div><label for="quantidade-venda">Quantidade:</label><input type="number" id="quantidade-venda" step="1" value="1" required></div>
                    <div><label for="preco-unitario">Preço Unitário (Venda):</label><input type="number" id="preco-unitario" step="0.01" required></div>
                    <div><label for="valor-total">Valor Total (Venda):</label><input type="number" id="valor-total" step="0.01" required></div>
                    <div><label for="data-venda">Data da Venda:</label><input type="date" id="data-venda" required></div>
                    <div><label for="forma-pagamento-venda">Forma de Pagamento:</label><input type="text" id="forma-pagamento-venda" required></div>
                </form>
            `;
            // Carrega os selects de Clientes e Produtos (opções que foram renderizadas anteriormente)
            setTimeout(() => {
                const modalClienteVenda = document.getElementById('cliente-venda-modal');
                const modalProdutoVenda = document.getElementById('produto-venda-modal');

                if (modalClienteVenda && selectClienteVenda) {
                    modalClienteVenda.innerHTML = selectClienteVenda.innerHTML;
                }
                   if (modalProdutoVenda && selectProdutoVenda) {
                    modalProdutoVenda.innerHTML = selectProdutoVenda.innerHTML;
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
        novoItem = {
            clienteId: formElement.querySelector('#cliente-venda-modal').value,
            produtoId: formElement.querySelector('#produto-venda-modal').value,
            quantidade: parseFloat(formElement.querySelector('#quantidade-venda').value),
            precoUnitario: parseFloat(formElement.querySelector('#preco-unitario').value),
            valorTotal: parseFloat(formElement.querySelector('#valor-total').value),
            dataVenda: formElement.querySelector('#data-venda').value,
            formaPagamento: formElement.querySelector('#forma-pagamento-venda').value, 
        };
        if (!novoItem.clienteId || !novoItem.produtoId || isNaN(novoItem.valorTotal)) {
             alert("Todos os campos de Venda são obrigatórios."); return;
        }
    
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
            <td><td>${produto.unidade || 'N/A'}</td></td>
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
            clienteId: vendaData.clienteId,
            produtoId: vendaData.produtoId,
            quantidade: vendaData.quantidade,
            precoUnitario: vendaData.precoUnitario,
            valorTotal: vendaData.valorTotal,
            dataVenda: vendaData.dataVenda,
            formaPagamento: vendaData.formaPagamento,
            criadoEm: firebase.firestore.FieldValue.serverTimestamp()
        };

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
        const nomeCliente = clientesCache[venda.clienteId] || `ID Cliente: ${venda.clienteId.substring(0, 5)}...`;
        const nomeProduto = produtosCache[venda.produtoId] || `ID Produto: ${venda.produtoId.substring(0, 5)}...`;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${nomeCliente}</td>
            <td>${nomeProduto}</td>
            <td>${venda.quantidade}</td>
            <td>R$ ${venda.precoUnitario ? venda.precoUnitario.toFixed(2) : '0.00'}</td> 
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
            alert("Erro ao excluir. Verifique o console.");
        }
    }
}


// =========================================================
// 7. LÓGICA DE NAVEGAÇÃO E INICIALIZAÇÃO DE DADOS (CRÍTICO)
// =========================================================

navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        
        const targetId = item.getAttribute('data-target');
        const targetSection = document.getElementById(targetId);

        document.querySelectorAll('.page-section').forEach(section => {
            section.classList.remove('active-section');
        });
        document.querySelectorAll('.nav-item').forEach(nav => {
            nav.classList.remove('active');
        });

        if (targetSection) {
            targetSection.classList.add('active-section');
            item.classList.add('active');
            
            topHeader.querySelector('h2').textContent = item.textContent;
        }
    });
});


// FUNÇÃO DE INICIALIZAÇÃO (Resolve o TypeError)
document.addEventListener('DOMContentLoaded', () => {
    // Simula o clique inicial no primeiro item para carregar a seção
    const initialItem = document.querySelector('.nav-item.active');
    if (initialItem) {
        initialItem.click(); 
    }
    
    // GARANTIA: Iniciar listeners do Firebase apenas após o DOM estar pronto
    if (typeof db !== 'undefined' && db.collection) {

        // CLIENTES: (ATUALIZADO)
        db.collection('clientes').orderBy('criadoEm', 'desc')
            .onSnapshot(snapshot => {
                renderizarClientes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            }, error => {
                console.error("Erro ao carregar clientes: ", error);
            });
            
        // PRODUTOS: (ATUALIZADO)
        db.collection('produtos').orderBy('criadoEm', 'desc')
            .onSnapshot(snapshot => {
                renderizarProdutos(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            }, error => {
                console.error("Erro ao carregar produtos: ", error);
            });

        // VENDAS
        db.collection('vendas').orderBy('criadoEm', 'desc')
            .onSnapshot(snapshot => {
                renderizarVendas(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            }, error => {
                console.error("Erro ao carregar vendas: ", error);
            });

        // FLUXO DE CAIXA
        db.collection('fluxo').orderBy('criadoEm', 'desc')
            .onSnapshot(snapshot => {
                renderizarFluxo(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            }, error => {
                console.error("Erro ao carregar fluxo de caixa: ", error);
            });
            
        // INSUMOS
        db.collection('insumos').orderBy('criadoEm', 'desc')
            .onSnapshot(snapshot => {
                renderizarInsumos(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            }, error => {
                console.error("Erro ao carregar insumos: ", error);
            });
            
    } else {
        console.error("Firebase Firestore (db) não foi inicializado corretamente.");
    }
});