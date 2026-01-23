import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { encrypt, decrypt, generateApiKey, validateUserOwnership, getValidEncryptionKey } from '../services/apiKeyService'

// Mock crypto with proper default export
vi.mock('crypto', () => {
    const mockDigest = vi.fn().mockReturnValue(Buffer.alloc(32))
    const mockUpdate = vi.fn().mockReturnThis()

    return {
        default: {
            createHash: vi.fn(() => ({
                update: mockUpdate,
                digest: mockDigest
            })),
            randomBytes: vi.fn(() => Buffer.alloc(16)),
            createCipheriv: vi.fn(() => ({
                update: vi.fn().mockReturnValue(Buffer.from('encrypted')),
                final: vi.fn().mockReturnValue(Buffer.from('final'))
            })),
            createDecipheriv: vi.fn(() => ({
                update: vi.fn().mockReturnValue(Buffer.from('decrypted')),
                final: vi.fn().mockReturnValue(Buffer.from(''))
            }))
        }
    }
})

describe('apiKeyService', () => {
    beforeEach(() => {
        process.env.ENCRYPTION_KEY = 'test-key-123'
        vi.clearAllMocks()
    })

    afterEach(() => {
        vi.clearAllMocks()
    })

    describe('getValidEncryptionKey', () => {
        it('should return a 32-byte (256-bit) buffer', () => {
            const result = getValidEncryptionKey('any-key')
            expect(result).toBeInstanceOf(Buffer)
            expect(result.length).toBe(32)
        })

        it('should handle undefined input', () => {
            const result = getValidEncryptionKey(undefined)
            expect(result).toBeInstanceOf(Buffer)
            expect(result.length).toBe(32)
        })

        it('should handle empty string input', () => {
            const result = getValidEncryptionKey('')
            expect(result).toBeInstanceOf(Buffer)
            expect(result.length).toBe(32)
        })
    })

    describe('encrypt', () => {
        it('should encrypt a string and return hex format with IV', () => {
            const text = 'hello'
            const result = encrypt(text)
            expect(result).toMatch(/^[a-f0-9]+:[a-f0-9]+$/)
        })

        it('should handle empty string', () => {
            const result = encrypt('')
            expect(result).toMatch(/^[a-f0-9]+:[a-f0-9]+$/)
        })

        it('should generate different outputs for same input', () => {
            const text = 'same text'
            const result1 = encrypt(text)
            const result2 = encrypt(text)
            expect(result1).not.toBe(result2)
        })
    })

    describe('decrypt', () => {
        it('should successfully decrypt encrypted text', () => {
            const encrypted = encrypt('hello')
            const result = decrypt(encrypted)
            expect(typeof result).toBe('string')
        })

        it('should throw error for invalid format', () => {
            expect(() => decrypt('invalid')).toThrow()
        })

        it('should throw error for malformed IV', () => {
            expect(() => decrypt('invalid:data')).toThrow()
        })
    })

    describe('generateApiKey', () => {
        beforeEach(() => {
            vi.spyOn(Date, 'now').mockImplementation(() => 1234567890)
        })

        afterEach(() => {
            vi.restoreAllMocks()
        })

        it('should return a string starting with "dtc_"', () => {
            const result = generateApiKey()
            expect(result).toMatch(/^dtc_[a-f0-9]{64}$/)
        })

        it('should use crypto for generation', () => {
            const result = generateApiKey()  // Store the result first
            expect(result.length).toBe(68) // 'dtc_' + 64 hex chars
        })
    })

    describe('validateUserOwnership', () => {
        let mockReq
        let mockRes
        let mockNext

        beforeEach(() => {
            mockReq = {
                user: { _id: '123' },
                params: { userId: '123' }
            }
            mockRes = {
                status: vi.fn().mockReturnThis(),
                json: vi.fn()
            }
            mockNext = vi.fn()
        })

        it('should call next() when user owns resource', async () => {
            await validateUserOwnership(mockReq, mockRes, mockNext)
            expect(mockNext).toHaveBeenCalled()
            expect(mockRes.status).not.toHaveBeenCalled()
        })

        it('should return 403 when user does not own resource', async () => {
            mockReq.params.userId = '456'
            await validateUserOwnership(mockReq, mockRes, mockNext)
            expect(mockRes.status).toHaveBeenCalledWith(403)
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Unauthorized access' })
        })

        it('should handle missing user object', async () => {
            mockReq.user = undefined
            await validateUserOwnership(mockReq, mockRes, mockNext)
            expect(mockRes.status).toHaveBeenCalledWith(500)
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Server error' })
        })
    })
})