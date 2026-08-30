/**
 * Data Generator Utility
 * Generates random test data like mobile numbers, PAN, Aadhar, names, etc.
 */
export class DataGenerator {
  
  /**
   * Generate a random 10-digit Indian mobile number starting with 6, 7, or 8
   */
  static generateMobileNumber(): string {
    const firstDigit = Math.floor(Math.random() * 3) + 6; // 6, 7, or 8
    const remaining = Array.from({ length: 9 }, () => 
      Math.floor(Math.random() * 10)
    ).join('');
    return `${firstDigit}${remaining}`;
  }

  /**
   * Generate a random PAN number in format: ABCDE1234F
   */
  static generatePanNumber(): string {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const rand = (str: string) => str[Math.floor(Math.random() * str.length)];
    
    return [
      rand(letters), rand(letters), rand(letters), 'P', rand(letters),
      rand(numbers), rand(numbers), rand(numbers), rand(numbers),
      rand(letters)
    ].join('');
  }

  /**
   * Generate a random 4-digit Aadhar segment (for testing)
   */
  static generateAadharNumber(): string {
    return String(Math.floor(1000 + Math.random() * 9000));
  }

  /**
   * Generate a random 12-digit full Aadhar number
   */
  static generateFullAadharNumber(): string {
    return Array.from({ length: 12 }, () => 
      Math.floor(Math.random() * 10)
    ).join('');
  }

  /**
   * Generate a random name with optional prefix
   */
  static generateName(prefix: string = 'Auto'): string {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const random = Array.from({ length: 6 }, () =>
      letters[Math.floor(Math.random() * letters.length)]
    ).join('');
    return `${prefix}${random}`;
  }

  /**
   * Generate a random 14-digit bank account number
   */
  static generateAccountNumber(): string {
    const firstDigit = Math.floor(Math.random() * 9) + 1;
    const remaining = Array.from({ length: 13 }, () =>
      Math.floor(Math.random() * 10)
    ).join('');
    return `${firstDigit}${remaining}`;
  }

  /**
   * Generate a file barcode (3 letters + 10-12 digits)
   */
  static generateFileBarcode(): string {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const prefix = Array.from({ length: 3 }, () =>
      letters[Math.floor(Math.random() * letters.length)]
    ).join('');
    const totalLength = Math.floor(Math.random() * 3) + 13;
    const digits = Array.from({ length: totalLength - 3 }, () =>
      Math.floor(Math.random() * 10)
    ).join('');
    return prefix + digits;
  }

  /**
   * Generate an ECS barcode (9 digits + 1 special char)
   */
  static generateECSBarcode(): string {
    const digits = '0123456789';
    const specialChars = '!@#$%^&*';
    let barcode = Array.from({ length: 9 }, () =>
      digits[Math.floor(Math.random() * digits.length)]
    ).join('');
    const lastCharPool = digits + specialChars;
    barcode += lastCharPool[Math.floor(Math.random() * lastCharPool.length)];
    return barcode;
  }

  /**
   * Format a date object to string
   */
  static formatDate(date: Date, format: 'DD-MM-YYYY' | 'DD/MM/YYYY' = 'DD-MM-YYYY'): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const separator = format.includes('/') ? '/' : '-';
    return `${day}${separator}${month}${separator}${year}`;
  }

  /**
   * Get today's date formatted
   */
  static getToday(format: 'DD/MM/YYYY' | 'YYYY-MM-DD' | 'DD-MM-YYYY' = 'DD/MM/YYYY'): string {
    const date = new Date();
    if (format === 'YYYY-MM-DD') {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${year}-${month}-${day}`;
    }
    return this.formatDate(date, format === 'DD/MM/YYYY' ? 'DD/MM/YYYY' : 'DD-MM-YYYY');
  }

  /**
   * Get date of birth for a given age
   */
  static getDOBForAge(age: number): string {
    const today = new Date();
    const dob = new Date(today.getFullYear() - age, today.getMonth(), today.getDate());
    return this.formatDate(dob);
  }

  /**
   * Get date with offset (years, months, days in past)
   */
  static getDateOffset(years: number, months: number, days: number): string {
    const date = new Date();
    date.setFullYear(date.getFullYear() - years);
    date.setMonth(date.getMonth() - months);
    date.setDate(date.getDate() - days);
    return this.formatDate(date, 'DD/MM/YYYY');
  }

  /**
   * Get future date
   */
  static getFutureDate(years: number, months: number, days: number): string {
    const date = new Date();
    date.setFullYear(date.getFullYear() + years);
    date.setMonth(date.getMonth() + months);
    date.setDate(date.getDate() + days);
    return this.formatDate(date, 'DD/MM/YYYY');
  }

  /**
   * Generate Deal ID (format: CS + 8 random digits)
   */
  static generateDealID(): string {
    const digits = Array.from({ length: 8 }, () => 
      Math.floor(Math.random() * 10)
    ).join('');
    return `CS${digits}`;
  }

  /**
   * Generate 16-digit card number
   */
  // static generateCardNumber(): string {
  //   return Array.from({ length: 16 }, () => 
  //     Math.floor(Math.random() * 10)
  //   ).join('');
  // }

  /**
   * Generate driving license number (format: AA0000000000000)
   */
  static generateDrivingLicense(): string {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const stateCode = Array.from({ length: 2 }, () =>
      letters[Math.floor(Math.random() * letters.length)]
    ).join('');
    const numbers = Array.from({ length: 13 }, () =>
      Math.floor(Math.random() * 10)
    ).join('');
    return `${stateCode}${numbers}`;
  }

  /**
   * Generate bank account number with timestamp (14 digits)
   */
  static generateAccountNumberWithTimestamp(): string {
    const timestamp = Date.now().toString().slice(-8); // Last 8 digits of timestamp
    const remaining = Array.from({ length: 6 }, () =>
      Math.floor(Math.random() * 10)
    ).join('');
    return `${timestamp}${remaining}`;
  }

  /**
   * Generate IFSC code (format: AAAA0######)
   */
  static generateIFSC(): string {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const bankCode = Array.from({ length: 4 }, () =>
      letters[Math.floor(Math.random() * letters.length)]
    ).join('');
    const branchCode = Array.from({ length: 7 }, () =>
      Math.floor(Math.random() * 10)
    ).join('');
    return `${bankCode}0${branchCode}`;
  }

  /**
   * Generate random email
   */
  static generateEmail(domain: string = 'test.com'): string {
    const username = this.generateName('user').toLowerCase();
    const timestamp = Date.now();
    return `${username}${timestamp}@${domain}`;
  }

  /**
   * Generate random amount within range
   */
  static generateAmount(min: number = 1000, max: number = 100000): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Generate random percentage
   */
  static generatePercentage(min: number = 1, max: number = 100): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Generate reference number (alphanumeric, 10 characters)
   */
  static generateReferenceNumber(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return Array.from({ length: 10 }, () =>
      chars[Math.floor(Math.random() * chars.length)]
    ).join('');
  }

  /**
   * Generate OTP (One Time Password)
   */
  static generateOTP(length: number = 6): string {
    return Array.from({ length }, () =>
      Math.floor(Math.random() * 10)
    ).join('');
  }

  /**
   * Mask sensitive data (show only first and last 2 characters)
   */
  static maskData(data: string, visibleChars: number = 2): string {
    if (data.length <= visibleChars * 2) {
      return '*'.repeat(data.length);
    }
    const start = data.substring(0, visibleChars);
    const end = data.substring(data.length - visibleChars);
    const masked = '*'.repeat(data.length - (visibleChars * 2));
    return `${start}${masked}${end}`;
  }

  /**
   * Generate timestamp string
   */
  static getTimestamp(format: 'full' | 'date' | 'time' = 'full'): string {
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const time = now.toTimeString().split(' ')[0];
    
    switch (format) {
      case 'date': return date;
      case 'time': return time;
      default: return `${date}_${time.replace(/:/g, '-')}`;
    }
  }

  /**
   * Generate unique ID (combination of timestamp and random string)
   */
  static generateUniqueID(prefix: string = ''): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return prefix ? `${prefix}_${timestamp}_${random}` : `${timestamp}_${random}`;
  }
}
