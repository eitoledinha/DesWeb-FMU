window.onload = function() {
    const formatar = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    // ========================================================================== 
    // 1. CORREÇÃO: Recupera o objeto unificado do LocalStorage
    // ==========================================================================
    const dadosEdicao = JSON.parse(localStorage.getItem('dadosSimulacaoEdicao')) || {};

    // Extrai os valores numéricos de dentro do objeto unificado
    const rendaTotalBruta = parseFloat(dadosEdicao.recebido) || 0;
    
    // CORREÇÃO AQUI: Dá prioridade para o 'tipoContrato' global (escolhido na primeira tela)
    // para evitar que a tela de Rendas mude o contrato para CLT de forma errônea.
    const tipoContrato = localStorage.getItem("tipoContrato") || dadosEdicao.contrato || "";
    
    // Puxa os gastos e investimentos das outras chaves do localStorage
    const gastos = parseFloat(localStorage.getItem("totalGastos")) || 0;
    const investmentoRaw = localStorage.getItem("totalInvestimento") || localStorage.getItem("totalInvestimentos");
    const investimento = parseFloat(investmentoRaw) || 0;
    
    // Isola o Salário Bruto do objeto para o cálculo do INSS
    let salarioPuro = 0;
    if (dadosEdicao.detalheRendas && dadosEdicao.detalheRendas.salario) {
        let salarioLimpo = dadosEdicao.detalheRendas.salario.replace("R$", "").replace(/\./g, "").replace(",", ".").trim();
        salarioPuro = parseFloat(salarioLimpo) || 0;
    } else {
        salarioPuro = rendaTotalBruta; // Fallback de segurança
    }
    
    // ==========================================================================
    // 2. CÁLCULO DA TABELA DO INSS (PROGRESSIVO EM CIMA APENAS DO SALÁRIO)
    // ==========================================================================
    let inss = 0;
    
    // VALIDAÇÃO CORRIGIDA: Remove acentos e espaços para evitar qualquer erro de digitação no HTML anterior
    let contratoLimpo = tipoContrato.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    let isEstagio = contratoLimpo.includes("estagio") || contratoLimpo.includes("outros") || contratoLimpo === "freelancer";

    if (!isEstagio && salarioPuro > 0) {
        let salarioRestante = salarioPuro;

        // Faixa 1: Até 1045.00 (7.5%)
        if (salarioRestante > 1045.00) {
            inss += 1045.00 * 0.075;
            salarioRestante -= 1045.00;
        } else {
            inss += salarioRestante * 0.075;
            salarioRestante = 0;
        }

        // Faixa 2: De 1045.01 até 2089.60 (9%)
        if (salarioRestante > 0) {
            let limiteFaixa2 = 2089.60 - 1045.00;
            let baseFaixa2 = Math.min(salarioRestante, limiteFaixa2);
            inss += baseFaixa2 * 0.09;
            salarioRestante -= baseFaixa2;
        }

        // Faixa 3: De 2089.61 até 3134.40 (12%)
        if (salarioRestante > 0) {
            let limiteFaixa3 = 3134.40 - 2089.60;
            let baseFaixa3 = Math.min(salarioRestante, limiteFaixa3);
            inss += baseFaixa3 * 0.12;
            salarioRestante -= baseFaixa3;
        }

        // Faixa 4: De 3134.41 até 6101.06 (14%)
        if (salarioRestante > 0) {
            let limiteFaixa4 = 6101.06 - 3134.40;
            let baseFaixa4 = Math.min(salarioRestante, limiteFaixa4);
            inss += baseFaixa4 * 0.14;
            salarioRestante -= baseFaixa4;
        }

        // Faixa 5: De 6101.07 até 10448.00 (14.5%)
        if (salarioRestante > 0) {
            let limiteFaixa5 = 10448.00 - 6101.06;
            let baseFaixa5 = Math.min(salarioRestante, limiteFaixa5);
            inss += baseFaixa5 * 0.145;
            salarioRestante -= baseFaixa5;
        }

        // Faixa 6: De 10448.01 até 20896.00 (16.5%)
        if (salarioRestante > 0) {
            let limiteFaixa6 = 20896.00 - 10448.00;
            let baseFaixa6 = Math.min(salarioRestante, limiteFaixa6);
            inss += baseFaixa6 * 0.165;
            salarioRestante -= baseFaixa6;
        }

        // Faixa 7: De 20896.01 até 40747.20 (19%)
        if (salarioRestante > 0) {
            let limiteFaixa7 = 40747.20 - 20896.00;
            let baseFaixa7 = Math.min(salarioRestante, limiteFaixa7);
            inss += baseFaixa7 * 0.19;
            salarioRestante -= baseFaixa7;
        }

        // Faixa 8: Acima de 40747.20 (22%)
        if (salarioRestante > 0) {
            inss += salarioRestante * 0.22;
        }
    } 

    // ==========================================================================
    // 3. CÁLCULO DA RENDA LÍQUIDA E SOBRA REAL
    // ==========================================================================
    const rendaLiquida = rendaTotalBruta - inss;
    const sobra = rendaLiquida - gastos - investimento;

    // ==========================================================================
    // 4. PREENCHIMENTO DOS CARDS NO HTML
    // ==========================================================================
    if (document.getElementById("res-renda")) {
        document.getElementById("res-renda").innerText = formatar(rendaLiquida);
    }
    
    if (document.getElementById("res-gastos")) {
        document.getElementById("res-gastos").innerText = formatar(gastos);
    }
    
    if (document.getElementById("res-investimento")) {
        document.getElementById("res-investimento").innerText = formatar(investimento);
    }
    
    if (document.getElementById("res-saldo")) {
        document.getElementById("res-saldo").innerText = formatar(sobra);
    }

    // ==========================================================================
    // 5. EXIBIÇÃO DO INSS
    // ==========================================================================
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

    // ==========================================================================
    // 6. ESTILIZAÇÃO VISUAL DA SOBRA
    // ==========================================================================
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
    
    window.location.href = "../Dashboard.html"; 
}
