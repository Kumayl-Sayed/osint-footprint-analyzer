// Page load animation
document.addEventListener('DOMContentLoaded', () => {
    const container = document.querySelector('.container');
    container.classList.add('fade-in'); // Already in HTML, but ensures it
});

// Form submission
document.getElementById('analyzeForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const domain = document.getElementById('domainInput').value.trim();
    if (!domain) return;

    const loading = document.getElementById('loading');
    const results = document.getElementById('results');
    const errorDiv = document.getElementById('error');

    // Reset UI
    loading.style.display = 'block';
    results.style.display = 'none';
    errorDiv.style.display = 'none';
    results.innerHTML = ''; // Clear previous results

    

    try {
        const response = await fetch('/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ domain })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        displayResults(data);
    } catch (error) {
        errorDiv.textContent = `Error: ${error.message}`;
        errorDiv.style.display = 'block';
    } finally {
        loading.style.display = 'none';
    }
});

// Helper sleep function
// Helper sleep
// Helper sleep
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Typewriter function with blinking cursor and page shift
async function typeWriter(li, text, speed = 5) {
    // Create cursor dot
    const cursor = document.createElement('span');
    cursor.classList.add('typing-cursor');
    li.appendChild(cursor);

    return new Promise(resolve => {
        let i = 0;
        function typing() {
            if (i < text.length) {
                li.textContent += text.charAt(i);
                li.appendChild(cursor); // keep cursor at the end

                // Scroll down gradually, leaving extra space
                const extraSpace = 150; // px below text
                const elementBottom = li.getBoundingClientRect().bottom;
                const viewportHeight = window.innerHeight;
                if (elementBottom > viewportHeight - extraSpace) {
                    window.scrollBy({
                        top: elementBottom - viewportHeight + extraSpace,
                        left: 0,
                        behavior: 'smooth'
                    });
                }

                i++;
                setTimeout(typing, speed);
            } else {
                cursor.remove(); // remove cursor when done
                resolve();
            }
        }
        typing();
    });
}

// Example: usage with sequential section (simplified)
async function displayResults(data) {
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = ''; 
    resultsDiv.style.display = 'block';

    function createSection(title) {
        const div = document.createElement('div');
        div.classList.add('section');
        div.innerHTML = `<h3>${title}</h3><ul></ul>`;
        return { div, ul: div.querySelector('ul') };
    }

    // WHOIS Section
    const whois = createSection("WHOIS Information");
    resultsDiv.appendChild(whois.div);
    if (data.whois.error) {
        const li = document.createElement('li');
        whois.ul.appendChild(li);
        await typeWriter(li, data.whois.error, 25);
    } else {
        for (const item of [
            `Domain: ${data.whois.domain_name}`,
            `Registrar: ${data.whois.registrar}`,
            `Creation Date: ${data.whois.creation_date}`,
            `Expiration Date: ${data.whois.expiration_date}`,
            `Name Servers: ${data.whois.name_servers}`,
            `Emails: ${data.whois.emails}`
        ]) {
            const li = document.createElement('li');
            whois.ul.appendChild(li);
            await typeWriter(li, item, 10);
            await sleep(2);
        }
    }

    // IP Section
    const ipSection = createSection("IP Address");
    resultsDiv.appendChild(ipSection.div);
    const liIp = document.createElement('li');
    ipSection.ul.appendChild(liIp);
    await typeWriter(liIp, data.ip || "No IP found", 5);
    await sleep(2);

    // DNS Section
    const dnsSection = createSection("DNS Records");
    resultsDiv.appendChild(dnsSection.div);
    const dnsEntries = Object.entries(data.dns).filter(([_, records]) => records.length > 0);
    if (dnsEntries.length === 0) {
        const li = document.createElement('li');
        dnsSection.ul.appendChild(li);
        await typeWriter(li, "No DNS records found.", 25);
    } else {
        for (const [type, records] of dnsEntries) {
            const li = document.createElement('li');
            dnsSection.ul.appendChild(li);
            await typeWriter(li, `${type}: ${records.join(", ")}`, 1);
            await sleep(1);
        }
    }

    // Subdomains Section
    const subSection = createSection("Detected Subdomains");
    resultsDiv.appendChild(subSection.div);
    if (data.subdomains.length === 0) {
        const li = document.createElement('li');
        subSection.ul.appendChild(li);
        await typeWriter(li, "No subdomains detected (limited scan).", 25);
    } else {
        for (const sub of data.subdomains) {
            const li = document.createElement('li');
            subSection.ul.appendChild(li);
            await typeWriter(li, `${sub.subdomain} -> ${sub.ip}`, 5);
            await sleep(20);
        }
    }

    // Web Tech Section
    const techSection = createSection("Web Technologies");
    resultsDiv.appendChild(techSection.div);
    if (data.web_tech.error) {
        const li = document.createElement('li');
        techSection.ul.appendChild(li);
        await typeWriter(li, data.web_tech.error, 25);
    } else {
        for (const item of [
            `Server: ${data.web_tech.server}`,
            `Powered By: ${data.web_tech.powered_by}`,
            `Status Code: ${data.web_tech.status_code}`
        ]) {
            const li = document.createElement('li');
            techSection.ul.appendChild(li);
            await typeWriter(li, item, 5);
            await sleep(20);
        }
    }
}







// Add result title style (in JS for dynamism, but could be in CSS)
const style = document.createElement('style');
style.textContent = `
    .result-title {
        text-align: center;
        font-size: 2em;
        margin-bottom: 30px;
        color: var(--text-primary);
        animation: fadeIn 0.5s ease;
    }
`;
document.head.appendChild(style);
