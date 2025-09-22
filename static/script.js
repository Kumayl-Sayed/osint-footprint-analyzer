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

function displayResults(data) {
    const resultsDiv = document.getElementById('results');
    let html = `<h2 class="result-title">Analysis for ${data.domain}</h2>`;

    // WHOIS
    html += '<div class="section" data-section="1"><h3>WHOIS Information</h3>';
    if (data.whois.error) {
        html += `<p>${data.whois.error}</p>`;
    } else {

        html += `<ul><li>Domain: ${data.whois.domain_name}</li>`;
        html += `<li>Registrar: ${data.whois.registrar}</li>`;
        html += `<li>Creation Date: ${data.whois.creation_date}</li>`;
        html += `<li>Expiration Date: ${data.whois.expiration_date}</li>`;
        html += `<li>Name Servers: ${data.whois.name_servers}</li>`;
        html += `<li>Emails: ${data.whois.emails}</li></ul>`;

    }
    html += '</div>';

    // IP
    html += `<div class="section" data-section="2"><h3>IP Address</h3><p>${data.ip}</p></div>`;

    // DNS
    html += '<div class="section" data-section="3"><h3>DNS Records</h3>';
    for (const [type, records] of Object.entries(data.dns)) {
        if (records.length > 0) {
            html += `<p><strong>${type}:</strong> ${records.join(', ')}</p>`;
        }
    }
    if (Object.values(data.dns).every(recs => recs.length === 0)) {
        html += '<p>No DNS records found.</p>';
    }
    html += '</div>';

    // Subdomains
    html += '<div class="section" data-section="4"><h3>Detected Subdomains</h3>';
    if (data.subdomains.length > 0) {
        html += '<ul>';
        data.subdomains.forEach(sub => {
            html += `<li>${sub.subdomain} -> ${sub.ip}</li>`;
        });
        html += '</ul>';
    } else {
        html += '<p>No subdomains detected (limited scan).</p>';
    }
    html += '</div>';

    // Web Tech
    html += '<div class="section" data-section="5"><h3>Web Technologies</h3>';
    if (data.web_tech.error) {
        html += `<p>${data.web_tech.error}</p>`;
    } else {
        html += `<ul><li>Server: ${data.web_tech.server}</li>`;
        html += `<li>Powered By: ${data.web_tech.powered_by}</li>`;
        html += `<li>Status Code: ${data.web_tech.status_code}</li></ul>`;
    }
    html += '</div>';

    resultsDiv.innerHTML = html;
    resultsDiv.style.display = 'block';

    // Staggered animation for sections
    const sections = resultsDiv.querySelectorAll('.section');
    sections.forEach((section, index) => {
        setTimeout(() => {
            section.classList.add('animate-section');
        }, index * 200); // 200ms delay per section for Zepto-like cascade
    });
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
