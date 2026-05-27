window.onload = function() {
    const formatar = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    // ==========================================================================
    // 1. RECUPERAÇÃO DOS DADOS DO LOCALSTORAGE
    // ==========================================================================
    const dadosEdicao = JSON.parse(localStorage.getItem('dadosSimulacaoEdicao')) || {};

    const rendaTotalBruta = parseFloat(dadosEdicao.recebido) || 0;
    const tipoContrato = localStorage.getItem("tipoContrato") || dadosEdicao.contrato || "";
    const gastos = parseFloat(localStorage.getItem("totalGastos")) || 0;
    const investmentoRaw = localStorage.getItem("totalInvestimento") || localStorage.getItem("totalInvestimentos");
    const investimento = parseFloat(investmentoRaw) || 0;
    
    let salarioPuro = 0;
    if (dadosEdicao.detalheRendas && dadosEdicao.detalheRendas.salario) {
        let salarioLimpo = dadosEdicao.detalheRendas.salario.replace("R$", "").replace(/\./g, "").replace(",", ".").trim();
        salarioPuro = parseFloat(salarioLimpo) || 0;
    } else {
        salarioPuro = rendaTotalBruta;
    }
    
    // ==========================================================================
    // 2. CÁLCULO DA TABELA DO INSS (PROGRESSIVO EM CIMA APENAS DO SALÁRIO)
    // ==========================================================================
    let inss = 0;
    let contratoLimpo = tipoContrato.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    let isEstagio = contratoLimpo.includes("estagio") || contratoLimpo.includes("outros") || contratoLimpo === "freelancer";

    if (!isEstagio && salarioPuro > 0) {
        let salarioRestante = salarioPuro;

        if (salarioRestante > 1045.00) { inss += 1045.00 * 0.075; salarioRestante -= 1045.00; } 
        else { inss += salarioRestante * 0.075; salarioRestante = 0; }

        if (salarioRestante > 0) {
            let baseFaixa2 = Math.min(salarioRestante, 1044.59);
            inss += baseFaixa2 * 0.09;
            salarioRestante -= baseFaixa2;
        }
        if (salarioRestante > 0) {
            let baseFaixa3 = Math.min(salarioRestante, 1044.80);
            inss += baseFaixa3 * 0.12;
            salarioRestante -= baseFaixa3;
        }
        if (salarioRestante > 0) {
            let baseFaixa4 = Math.min(salarioRestante, 2966.66);
            inss += baseFaixa4 * 0.14;
            salarioRestante -= baseFaixa4;
        }
        if (salarioRestante > 0) {
            let baseFaixa5 = Math.min(salarioRestante, 4346.93);
            inss += baseFaixa5 * 0.145;
            salarioRestante -= baseFaixa5;
        }
        if (salarioRestante > 0) {
            let baseFaixa6 = Math.min(salarioRestante, 10447.99);
            inss += baseFaixa6 * 0.165;
            salarioRestante -= baseFaixa6;
        }
        if (salarioRestante > 0) {
            let baseFaixa7 = Math.min(salarioRestante, 19851.19);
            inss += baseFaixa7 * 0.19;
            salarioRestante -= baseFaixa7;
        }
        if (salarioRestante > 0) {
            inss += salarioRestante * 0.22;
        }
    } 

    const rendaLiquida = rendaTotalBruta - inss;
    const sobra = rendaLiquida - gastos - investimento;

    // ==========================================================================
    // 3. PREENCHIMENTO DOS CARDS NO HTML
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

    // ==========================================================================
    // 4. PERSISTÊNCIA AUTOMÁTICA NO HISTÓRICO DO DASHBOARD
    // ==========================================================================
    try {
        const agora = new Date();
        const dataFormatada = agora.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });
        const horaFormatada = agora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) + "hs";

        let listaSimulacoes = JSON.parse(localStorage.getItem("listaSimulacoes")) || [];
        const idAtivo = localStorage.getItem('idEmEdicao');

        const dadosSalvamento = {
            id: idAtivo ? parseInt(idAtivo) : Date.now(),
            data: dataFormatada,
            hora: horaFormatada,
            contrato: contratoLimpo.toUpperCase(),
            recebido: rendaTotalBruta,
            gastos: gastos,
            sobra: sobra
        };

        if (idAtivo) {
            listaSimulacoes = listaSimulacoes.map(item => item.id === parseInt(idAtivo) ? dadosSalvamento : item);
            localStorage.removeItem('idEmEdicao');
        } else {
            listaSimulacoes.push(dadosSalvamento);
        }

        localStorage.setItem("listaSimulacoes", JSON.stringify(listaSimulacoes));
    } catch (erro) {
        console.error("Erro ao registrar a simulação no histórico:", erro);
    }
};

function voltarInicio() {
    localStorage.removeItem("totalRenda");
    localStorage.removeItem("totalGastos");
    localStorage.removeItem("totalInvestimento");
    localStorage.removeItem("tipoContrato");
    window.location.href = "../Dashboard.html"; 
}