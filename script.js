async function loadHTML(id, file) {
    try {
        const response = await fetch(file);
        if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
        const content = await response.text();
        
        const element = document.getElementById(id);
        if (element) {
            element.innerHTML = content;
        }
    } catch (error) {
        console.error("Erro ao carregar:", file, error);
    }
}

document.addEventListener("DOMContentLoaded", function() {
    loadHTML("header", "includes/header.html");
    loadHTML("footer", "includes/footer.html");
});
