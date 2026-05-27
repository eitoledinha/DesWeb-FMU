function salvarGastos() {
    const campos = ["Moradia", "Alimento", "Transporte", "Saude", "Assinaturas", "Lazer", "Educacao", "Investimento", "Outros"];
    let somaTudo = 0;
    let valorInvestimento = 0;

    const limpar = (v) => {
        if (!v) return 0;
        let limpo = v.replace("R$ ", "").replace(/\./g, "").replace(",", ".");
        return parseFloat(limpo) || 0;
    };

    campos.forEach(id => {
        const elemento = document.getElementById(id);
        if (elemento) {
            let valor = limpar(elemento.value);
            somaTudo += valor; // Soma absolutamente tudo primeiro
            
            if (id === "Investimento") {
                valorInvestimento = valor;
            }
        }
    });

    // A MÁGICA: O total de gastos é a soma de tudo MENOS o investimento
    let gastosReais = somaTudo - valorInvestimento;

    localStorage.setItem("totalGastos", gastosReais.toFixed(2));
    localStorage.setItem("totalInvestimento", valorInvestimento.toFixed(2));

    window.location.href = "PlanoAcao.html";
}

function formatarMoeda(i) {
    let v = i.value.replace(/\D/g, "");
    v = (v / 100).toFixed(2).replace(".", ",");
    v = v.replace(/(\d)(\d{3})(\d{3}),/g, "$1.$2.$3,");
    v = v.replace(/(\d)(\d{3}),/g, "$1.$2,");
    i.value = "R$ " + v;
}
