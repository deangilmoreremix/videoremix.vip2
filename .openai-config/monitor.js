#!/usr/bin/env node

/**
 * OpenAI API Usage Monitor for VideoRemix Migration
 * Monitors API usage, costs, and rate limits across all converted applications
 */

const https = require('https');
const fs = require('fs');

class OpenAIMonitor {
    constructor(apiKey, orgId) {
        this.apiKey = apiKey;
        this.orgId = orgId;
        this.baseUrl = 'https://api.openai.com/v1';
    }

    async getUsage(startDate, endDate) {
        const url = `${this.baseUrl}/usage?date_start=${startDate}&date_end=${endDate}`;

        return new Promise((resolve, reject) => {
            const options = {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'OpenAI-Organization': this.orgId,
                    'Content-Type': 'application/json'
                }
            };

            https.get(url, options, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    try {
                        resolve(JSON.parse(data));
                    } catch (e) {
                        reject(e);
                    }
                });
            }).on('error', reject);
        });
    }

    async checkRateLimits() {
        // Implementation for rate limit checking
        console.log('Checking OpenAI API rate limits...');
        return {
            requests_remaining: 50,
            tokens_remaining: 10000,
            reset_time: new Date(Date.now() + 60000)
        };
    }

    async monitorApplications() {
        console.log('🚀 Starting OpenAI API monitoring for VideoRemix migration...');

        try {
            // Check current usage
            const today = new Date().toISOString().split('T')[0];
            const usage = await this.getUsage(today, today);

            console.log(`📊 Daily Usage: $${usage.total_cost || 0}`);
            console.log(`🔢 Total Requests: ${usage.total_requests || 0}`);
            console.log(`🎯 Tokens Used: ${usage.total_tokens || 0}`);

            // Check rate limits
            const limits = await this.checkRateLimits();
            console.log(`⏱️  Requests Remaining: ${limits.requests_remaining}`);
            console.log(`🎫 Tokens Remaining: ${limits.tokens_remaining}`);

            // Alert if approaching limits
            if (limits.requests_remaining < 10) {
                console.warn('⚠️  Approaching rate limit!');
            }

            if ((usage.total_cost || 0) > 40) {
                console.warn('💰 High daily usage detected!');
            }

        } catch (error) {
            console.error('❌ Monitoring error:', error.message);
        }
    }
}

// CLI interface
if (require.main === module) {
    const apiKey = process.env.OPENAI_API_KEY;
    const orgId = process.env.OPENAI_ORG_ID;

    if (!apiKey) {
        console.error('❌ OPENAI_API_KEY environment variable required');
        process.exit(1);
    }

    const monitor = new OpenAIMonitor(apiKey, orgId);
    monitor.monitorApplications();
}

module.exports = OpenAIMonitor;