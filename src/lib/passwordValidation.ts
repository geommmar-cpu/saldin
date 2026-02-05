// Password validation rules and utilities

export interface PasswordRule {
  id: string;
  label: string;
  test: (password: string) => boolean;
}

export interface PasswordValidationResult {
  isValid: boolean;
  rules: { id: string; label: string; passed: boolean }[];
  isCommonPassword: boolean;
}

// List of common weak passwords to block
const COMMON_PASSWORDS = [
  "123456",
  "12345678",
  "123456789",
  "1234567890",
  "password",
  "password1",
  "password123",
  "qwerty",
  "qwerty123",
  "abc123",
  "abcdef",
  "111111",
  "123123",
  "admin",
  "admin123",
  "letmein",
  "welcome",
  "welcome1",
  "monkey",
  "dragon",
  "master",
  "iloveyou",
  "sunshine",
  "princess",
  "football",
  "baseball",
  "soccer",
  "batman",
  "superman",
  "trustno1",
  "shadow",
  "access",
  "login",
  "passw0rd",
  "passwd",
  "senha",
  "senha123",
  "senha1234",
  "mudar123",
  "teste",
  "teste123",
  "usuario",
  "admin1",
  "12341234",
  "11111111",
  "00000000",
  "qazwsx",
  "123qwe",
  "1qaz2wsx",
  "1q2w3e4r",
  "asdfgh",
  "zxcvbn",
  "qwertyuiop",
  "654321",
  "121212",
  "000000",
  "666666",
  "696969",
  "michael",
  "charlie",
  "jessica",
  "ashley",
  "daniel",
  "thomas",
];

// Password validation rules
export const PASSWORD_RULES: PasswordRule[] = [
  {
    id: "minLength",
    label: "Mínimo de 8 caracteres",
    test: (password: string) => password.length >= 8,
  },
  {
    id: "uppercase",
    label: "Pelo menos 1 letra maiúscula",
    test: (password: string) => /[A-Z]/.test(password),
  },
  {
    id: "lowercase",
    label: "Pelo menos 1 letra minúscula",
    test: (password: string) => /[a-z]/.test(password),
  },
  {
    id: "number",
    label: "Pelo menos 1 número",
    test: (password: string) => /\d/.test(password),
  },
  {
    id: "special",
    label: "Pelo menos 1 caractere especial (!@#$%...)",
    test: (password: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password),
  },
];

/**
 * Check if password is in the common passwords list
 */
export const isCommonPassword = (password: string): boolean => {
  const normalizedPassword = password.toLowerCase().trim();
  return COMMON_PASSWORDS.includes(normalizedPassword);
};

/**
 * Validate password against all rules
 */
export const validatePassword = (password: string): PasswordValidationResult => {
  const rules = PASSWORD_RULES.map((rule) => ({
    id: rule.id,
    label: rule.label,
    passed: rule.test(password),
  }));

  const allRulesPassed = rules.every((rule) => rule.passed);
  const commonPassword = isCommonPassword(password);

  return {
    isValid: allRulesPassed && !commonPassword,
    rules,
    isCommonPassword: commonPassword,
  };
};

/**
 * Get password strength percentage (0-100)
 */
export const getPasswordStrength = (password: string): number => {
  if (!password) return 0;
  
  const validation = validatePassword(password);
  const passedRules = validation.rules.filter((r) => r.passed).length;
  const totalRules = validation.rules.length;
  
  // Deduct points if it's a common password
  if (validation.isCommonPassword) {
    return Math.max(0, (passedRules / totalRules) * 50);
  }
  
  return (passedRules / totalRules) * 100;
};

/**
 * Get strength label based on percentage
 */
export const getStrengthLabel = (strength: number): { label: string; color: string } => {
  if (strength === 0) return { label: "", color: "" };
  if (strength < 40) return { label: "Fraca", color: "text-destructive" };
  if (strength < 80) return { label: "Média", color: "text-yellow-500" };
  if (strength < 100) return { label: "Boa", color: "text-primary" };
  return { label: "Forte", color: "text-green-500" };
};
