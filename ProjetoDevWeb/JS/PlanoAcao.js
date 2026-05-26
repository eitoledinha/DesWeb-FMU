window.onload = function() {
    const formatar = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    // 1. Recupera os dados salvos do LocalStorage
    const rendaTotalBruta = parseFloat(localStorage.getItem("totalRenda")) || 0;
    const gastos = parseFloat(localStorage.getItem("totalGastos")) || 0;
    const investimento = parseFloat(localStorage.getItem("totalInvestimento")) || 0;
    const tipoContrato = localStorage.getItem("tipoContrato");
    
    // ==========================================================================
    // 2. CÁLCULO DA TABELA DO INSS
    // ==========================================================================
    let inss = 0;
    let isEstagio = tipoContrato && tipoContrato.toLowerCase() === "estagio";

    // Se não for estágio, aplica as alíquotas baseadas estritamente na tabela do Regime Próprio
    if (!isEstagio && rendaTotalBruta > 0) {
        if (rendaTotalBruta <= 1045.00) {
            inss = rendaTotalBruta * 0.075; // Até um salário mínimo: 7,5%
        } else if (rendaTotalBruta <= 2089.60) {
            inss = rendaTotalBruta * 0.09;  // De R$ 1.045,01 a R$ 2.089,60: 9%
        } else if (rendaTotalBruta <= 3134.40) {
            inss = rendaTotalBruta * 0.12;  // De R$ 2.089,61 a R$ 3.134,40: 12%
        } else if (rendaTotalBruta <= 6101.06) {
            inss = rendaTotalBruta * 0.14;  // De R$ 3.134,41 a R$ 6.101,06: 14%
        } else if (rendaTotalBruta <= 10448.00) {
            inss = rendaTotalBruta * 0.145; // De R$ 6.101,07 a R$ 10.448,00: 14,5%
        } else if (rendaTotalBruta <= 20896.00) {
            inss = rendaTotalBruta * 0.165; // De R$ 10.448,01 a R$ 20.896,00: 16,5%
        } else if (rendaTotalBruta <= 40747.20) {
            inss = rendaTotalBruta * 0.19;  // De R$ 20.896,01 a R$ 40.747,20: 19%
        } else {
            inss = rendaTotalBruta * 0.22;  // Acima de R$ 40.747,20: 22%
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
        // Exibe a Renda Líquida atualizada após o abatimento do imposto
        document.getElementById("res-renda").innerText = formatar(rendaLiquida);
    }
    
    if (document.getElementById("res-gastos")) {
        // Exibe o total de gastos puro conforme a nova estrutura
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
