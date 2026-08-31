const API_BASE = import.meta.env.VITE_API_URL || '';

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('usap_token', token);
    } else {
      localStorage.removeItem('usap_token');
    }
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('usap_token');
    }
    return this.token;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      if (response.status === 401 && !path.includes('/auth/login')) {
        this.setToken(null);
        window.location.reload();
      }
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }

  async login(username: string, password: string) {
    const data = await this.request<{ token: string; user: any }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    this.setToken(data.token);
    return data;
  }

  async getMe() {
    return this.request<any>('/api/auth/me');
  }

  async getUsers() {
    return this.request<any[]>('/api/users');
  }

  async updateUserRole(userId: string, role: string) {
    return this.request<any>(`/api/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  }

  async getTargets() {
    return this.request<any[]>('/api/targets');
  }

  async addTarget(target: { name: string; url: string; type: string; status?: string }) {
    return this.request<any>('/api/targets', { method: 'POST', body: JSON.stringify(target) });
  }

  async deleteTarget(id: string) {
    return this.request<any>(`/api/targets/${id}`, { method: 'DELETE' });
  }

  async getScans() {
    return this.request<any[]>('/api/scans');
  }

  async getScan(id: string) {
    return this.request<any>(`/api/scans/${id}`);
  }

  async startScan(targetId: string, checks: string[]) {
    return this.request<any>('/api/scans', { method: 'POST', body: JSON.stringify({ targetId, checks }) });
  }

  async getFindings(params?: { scanId?: string; targetId?: string; severity?: string }) {
    const query = new URLSearchParams();
    if (params?.scanId) query.set('scanId', params.scanId);
    if (params?.targetId) query.set('targetId', params.targetId);
    if (params?.severity) query.set('severity', params.severity);
    const qs = query.toString();
    return this.request<any[]>(`/api/findings${qs ? '?' + qs : ''}`);
  }

  async getFinding(id: string) {
    return this.request<any>(`/api/findings/${id}`);
  }

  async updateFindingStatus(id: string, status: string) {
    return this.request<any>(`/api/findings/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
  }

  async getMLDetections() {
    return this.request<any[]>('/api/ml-detections');
  }

  async addMLDetection(detection: any) {
    return this.request<any>('/api/ml-detections', { method: 'POST', body: JSON.stringify(detection) });
  }

  async getCredentials() {
    return this.request<any[]>('/api/credentials');
  }

  async addCredential(cred: any) {
    return this.request<any>('/api/credentials', { method: 'POST', body: JSON.stringify(cred) });
  }

  async deleteCredential(id: string) {
    return this.request<any>(`/api/credentials/${id}`, { method: 'DELETE' });
  }

  async getReports() {
    return this.request<any[]>('/api/reports');
  }

  async generateReport(scanIds: string[]) {
    return this.request<any>('/api/reports', { method: 'POST', body: JSON.stringify({ scanIds }) });
  }

  async updateReportStatus(id: string, status: string) {
    return this.request<any>(`/api/reports/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
  }

  async getAuditLogs() {
    return this.request<any[]>('/api/audit-logs');
  }

  async addAuditLog(log: any) {
    return this.request<any>('/api/audit-logs', { method: 'POST', body: JSON.stringify(log) });
  }

  async getPortScanResults() {
    return this.request<any[]>('/api/port-scan-results');
  }

  async getSubdomainResults() {
    return this.request<any[]>('/api/subdomain-results');
  }

  async getDashboardStats() {
    return this.request<any>('/api/dashboard/stats');
  }
}

export const api = new ApiClient();
export default api;
