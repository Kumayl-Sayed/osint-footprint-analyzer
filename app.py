from flask import Flask, render_template, request, jsonify
import whois
import dns.resolver
import requests
import socket
from urllib.parse import urlparse
import re

app = Flask(__name__)

# Simple wordlist for subdomain brute-force (educational only, limited to 10)
SUBDOMAIN_WORDLIST = ['www', 'mail', 'ftp', 'admin', 'test', 'dev', 'api', 'blog', 'shop', 'forum']

def get_whois_info(domain):
    try:
        w = whois.whois(domain)
        return {
            'domain_name': str(w.domain_name),
            'registrar': str(w.registrar),
            'creation_date': str(w.creation_date),
            'expiration_date': str(w.expiration_date),
            'name_servers': str(w.name_servers),
            'emails': str(w.email) if hasattr(w, 'email') else 'N/A'
        }
    except Exception as e:
        return {'error': f'WHOIS lookup failed: {str(e)}'}

def get_ip_address(domain):
    try:
        ip = socket.gethostbyname(domain)
        return ip
    except Exception as e:
        return f'IP lookup failed: {str(e)}'

def get_dns_records(domain):
    records = {}
    record_types = ['A', 'MX', 'NS', 'TXT']
    for rtype in record_types:
        try:
            answers = dns.resolver.resolve(domain, rtype)
            records[rtype] = [str(r) for r in answers]
        except Exception:
            records[rtype] = []
    return records

def get_subdomains(domain):
    subdomains = []
    for word in SUBDOMAIN_WORDLIST[:10]:  # Limit to avoid abuse
        subdomain = f"{word}.{domain}"
        try:
            ip = socket.gethostbyname(subdomain)
            subdomains.append({'subdomain': subdomain, 'ip': ip})
        except:
            pass  # Ignore non-existent
    return subdomains

def get_web_tech(domain):
    try:
        url = f"http://{domain}" if not domain.startswith('http') else domain
        response = requests.get(url, timeout=5, allow_redirects=True)
        server = response.headers.get('Server', 'N/A')
        powered_by = response.headers.get('X-Powered-By', 'N/A')
        return {'server': server, 'powered_by': powered_by, 'status_code': response.status_code}
    except Exception as e:
        return {'error': f'Web tech detection failed: {str(e)}'}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/analyze', methods=['POST'])
def analyze():
    domain = request.json.get('domain', '').strip()
    if not domain or not re.match(r'^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', domain):
        return jsonify({'error': 'Invalid domain format. Use e.g., example.com'}), 400

    # Clean domain (remove http/https)
    parsed = urlparse(domain if domain.startswith('http') else f'http://{domain}')
    clean_domain = parsed.netloc or parsed.path

    results = {
        'domain': clean_domain,
        'whois': get_whois_info(clean_domain),
        'ip': get_ip_address(clean_domain),
        'dns': get_dns_records(clean_domain),
        'subdomains': get_subdomains(clean_domain),
        'web_tech': get_web_tech(clean_domain)
    }
    return jsonify(results)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
