window.onload = function() {
    const formatar = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    // ==========================================================================
    // 1. RECUPERAÇÃO DOS DADOS DO LOCALSTORAGE (COM FALLBACKS SEGUROS)
    // ==========================================================================
    const dadosEdicao = JSON.parse(localStorage.getItem('dadosSimulacaoEdicao')) || {};

    // Tenta pegar a renda bruta do objeto de edição, se não existir, pega do totalRenda global
    const rendaTotalBruta = parseFloat(dadosEdicao.recebido) || parseFloat(localStorage.getItem("totalRenda")) || 0;
    
    // Prioridade para o contrato global ou do objeto de edição
    const tipoContrato = localStorage.getItem("tipoContrato") || dadosEdicao.contrato || "CLT";
    
    // Puxa os gastos e investimentos de forma segura
    const gastos = parseFloat(localStorage.getItem("totalGastos")) || 0;
    const investmentoRaw = localStorage.getItem("totalInvestimento") || localStorage.getItem("totalInvestimentos");
    const investimento = parseFloat(investmentoRaw) || 0;
    
    // Isola o Salário Bruto puro para o INSS
    let salarioPuro = 0;
    if (dadosEdicao.detalheRendas && dadosEdicao.detalheRendas.salario) {
        let salarioLimpo = dadosEdicao.detalheRendas.salario.replace("R$", "").replace(/\./g, "").replace(",", ".").trim();
        salarioPuro = parseFloat(salarioLimpo) || 0;
    } else {
        salarioPuro = rendaTotalBruta; 
    }
    
    // ==========================================================================
    // 2. CÁLCULO DA TABELA DO INSS PROGRESSIVO
    // ==========================================================================
    let inss = 0;
    let contratoLimpo = tipoContrato.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    let isEstagio = contratoLimpo.includes("estagio") || contratoLimpo.includes("outros") || contratoLimpo === "freelancer";

    if (!isEstagio && salarioPuro > 0) {
        let salarioRestante = salarioPuro;

        if (salarioRestante > 1045.00) { inss += 1045.00 * 0.075; salarioRestante -= 1045.00; } 
        else { inss += salarioRestante * 0.075; salarioRestante = 0; }

        if (salarioRestante > 0) {
            let limiteFaixa2 = 2089.60 - 1045.00;
            let baseFaixa2 = Math.min(salarioRestante, limiteFaixa2);
            inss += baseFaixa2 * 0.09;
            salarioRestante -= baseFaixa2;
        }
        if (salarioRestante > 0) {
            let limiteFaixa3 = 3134.40 - 2089.60;
            let baseFaixa3 = Math.min(salarioRestante, limiteFaixa3);
            inss += baseFaixa3 * 0.12;
            salarioRestante -= baseFaixa3;
        }
        if (salarioRestante > 0) {
            let limiteFaixa4 = 6101.06 - 3134.40;
            let baseFaixa4 = Math.min(salarioRestante, limiteFaixa4);
            inss += baseFaixa4 * 0.14;
            salarioRestante -= baseFaixa4;
        }
        if (salarioRestante > 0) {
            let limiteFaixa5 = 10448.00 - 6101.06;
            let baseFaixa5 = Math.min(salarioRestante, limiteFaixa5);
            inss += baseFaixa5 * 0.145;
            salarioRestante -= baseFaixa5;
        }
        if (salarioRestante > 0) {
            let limiteFaixa6 = 20896.00 - 10448.00;
            let baseFaixa6 = Math.min(salarioRestante, limiteFaixa6);
            inss += baseFaixa6 * 0.165;
            salarioRestante -= baseFaixa6;
        }
        if (salarioRestante > 0) {
            let limiteFaixa7 = 40747.20 - 20896.00;
            let baseFaixa7 = Math.min(salarioRestante, limiteFaixa7);
            inss += baseFaixa7 * 0.19;
            salarioRestante -= baseFaixa7;
        }
        if (salarioRestante > 0) { inss += salarioRestante * 0.22; }
    } 

    // ==========================================================================
    // 3. CÁLCULO DA RENDA LÍQUIDA E SOBRA REAL
    // ==========================================================================
    const rendaLiquida = rendaTotalBruta - inss;
    const sobra = rendaLiquida - gastos - investimento;

    // ==========================================================================
    // 4. ATUALIZAÇÃO OU CRIAÇÃO DO REGISTRO NO HISTÓRICO (PREVINE NaN)
    // ==========================================================================
    let listaSimulacoes = JSON.parse(localStorage.getItem('listaSimulacoes')) || [];

    if (dadosEdicao.id) {
        // Cenário A: Editando uma simulação existente
        dadosEdicao.sobra = sobra;
        dadosEdicao.recebido = rendaTotalBruta;
        dadosEdicao.contrato = tipoContrato;
        localStorage.setItem('dadosSimulacaoEdicao', JSON.stringify(dadosEdicao));
        
        listaSimulacoes = listaSimulacoes.map(item => {
            if (item.id === dadosEdicao.id) {
                item.sobra = sobra;
                item.recebido = rendaTotalBruta;
                item.contrato = tipoContrato;
                item.gastos = gastos;
            }
            return item;
        });
    } else {
        // Cenário B: Nova simulação do zero -> Cria o registro correto para o Dashboard
        const novaSimulacao = {
            id: Date.now(),
            data: new Date().toLocaleDateString('pt-BR'),
            hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) + 'hs',
            contrato: tipoContrato,
            recebido: rendaTotalBruta,
            gastos: gastos,
            sobra: sobra
        };
        listaSimulacoes.push(novaSimulacao);
    }
    
    // Salva a lista final atualizada sem erros
    localStorage.setItem('listaSimulacoes', JSON.stringify(listaSimulacoes));

    // ==========================================================================
    // 5. PREENCHIMENTO DOS CARDS NO HTML
    // ==========================================================================
    if (document.getElementById("res-renda")) document.getElementById("res-renda").innerText = formatar(rendaLiquida);
    if (document.getElementById("res-gastos")) document.getElementById("res-gastos").innerText = formatar(gastos);
    if (document.getElementById("res-investimento")) document.getElementById("res-investimento").innerText = formatar(investimento);
    if (document.getElementById("res-saldo")) document.getElementById("res-saldo").innerText = formatar(sobra);

    const campoInss = document.getElementById("res-inss");
    if (campoInss) {
        if (isEstagio) {
            campoInss.innerText = "Sem desconto";
            campoInss.style.color = "#00ff88";
        } else {
            campoInss.innerText = formatar(inss);
            campoInss.style.color = "#ff4d4d";
        }
    }

    const campoSobra = document.getElementById("res-saldo");
    if (campoSobra) {
        campoSobra.style.color = sobra < 0 ? "#ff4d4d" : "#00ff88";
    }
};

function voltarInicio() {
    localStorage.removeItem("totalRenda");
    localStorage.removeItem("totalGastos");
    localStorage.removeItem("totalInvestimento");
    localStorage.removeItem("tipoContrato");
    localStorage.removeItem("dadosSimulacaoEdicao"); // Limpa o estado de edição ao sair
    
    window.location.href = "../Dashboard.html"; 
}
