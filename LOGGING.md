# Logging Configuration

## 📊 **File-based Logging Setup**

### **Log Structure:**
```
logs/
├── api/
│   ├── app.log          # All API logs
│   └── error.log        # API errors only
├── bot/
│   ├── bot.log          # All bot logs
│   └── bot-error.log    # Bot errors only
├── worker/
│   ├── worker.log       # All worker logs
│   └── worker-error.log # Worker errors only
└── nginx/
    ├── access.log       # Nginx access logs
    └── error.log        # Nginx error logs
```

### **Log Format:**
```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "level": "info",
  "requestId": "req_123456789",
  "service": "api",
  "method": "POST",
  "url": "/click",
  "statusCode": 200,
  "duration": "45ms",
  "message": "Request completed"
}
```

### **Log Levels:**
- **info**: All requests and important events
- **warn**: Rate limits, retries, warnings
- **error**: Exceptions, failures, critical issues
- **debug**: Detailed debugging (stdout only)

### **Features:**
- ✅ **Structured JSON** logs in files
- ✅ **Pretty printed** logs in console
- ✅ **Request correlation** with requestId
- ✅ **Service separation** (api/bot/worker)
- ✅ **Error separation** (dedicated error files)
- ✅ **Docker volumes** for persistence

### **Usage:**
```bash
# View logs
tail -f logs/api/app.log
tail -f logs/bot/bot.log
tail -f logs/worker/worker.log

# View errors only
tail -f logs/api/error.log

# Search logs
grep "requestId:req_123" logs/api/app.log
```

### **Production Notes:**
- Logs are stored in Docker volumes
- Easy to integrate with ELK/EFK stack
- Structured format ready for log aggregation
- Request correlation across all services
