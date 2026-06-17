import { unref } from 'vue'
export function useFormatter() {
    const formatPubKey = (pubKeyArray) => {
        const data = unref(pubKeyArray)
        if (!data || !data.length) return 'No key assigned'
        
        const keyStr = data[0]
        const truncated = keyStr.length > 25 ? keyStr.substring(0, 25) + '...' : keyStr
        
        if (data.length > 1) {
        return `${truncated} (+${data.length - 1} keys)`
        }
        
        return truncated
    }
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A'
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        })
    }

    const formatDateTime = (dateString) => {
        if (!dateString) return 'N/A'
        try {
            return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
            })
        } catch {
            return dateString
        }
    }

    const formatDateTimeWithSeconds = (dateString) => {
        if (!dateString) return 'N/A'
        try {
            return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
            })
        } catch {
            return dateString
        }
    }

    const formatResource = (resource) => {
        if (!resource) return resource
        return resource.replace(/_/g, ' ')
    }
    
    return {
        formatPubKey,
        formatDate,
        formatDateTime,
        formatDateTimeWithSeconds,
        formatResource
    }
}
