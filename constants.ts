import { SecureFile, User, UserRole } from "./types";

export const MOCK_ADMIN: User = {
  id: 'admin-1',
  name: 'System Administrator',
  email: 'admin@secureshare.mil',
  role: UserRole.ADMIN,
  department: 'IT Security'
};

export const MOCK_USER: User = {
  id: 'user-1',
  name: 'Dr. Alice Researcher',
  email: 'alice@healthcare.org',
  role: UserRole.USER,
  department: 'Medical Research'
};

export const INITIAL_FILES: SecureFile[] = [
  {
    id: 'f1',
    name: 'Patient_Records_2024_Q1.enc',
    size: '45.2 MB',
    uploadDate: '2024-05-10',
    owner: 'admin-1',
    sensitivityLevel: 'High',
    description: 'Encrypted patient records for Q1 analysis. Requires HIPAA attribute clearance.',
    encryptedKey: 'ABE-MED-9921'
  },
  {
    id: 'f2',
    name: 'Military_Logistics_Delta.pdf.aes',
    size: '128.5 MB',
    uploadDate: '2024-05-12',
    owner: 'admin-1',
    sensitivityLevel: 'Top Secret',
    description: 'Supply chain logistics for Operation Delta. Attribute-Based Encryption enforced.',
    encryptedKey: 'ABE-MIL-7743'
  },
  {
    id: 'f3',
    name: 'Retail_Sales_Data_Raw.csv.enc',
    size: '12.4 MB',
    uploadDate: '2024-05-14',
    owner: 'admin-1',
    sensitivityLevel: 'Medium',
    description: 'Raw sales data from unstable retail servers. Protected via CSRF token validation.',
    encryptedKey: 'ABE-RET-3321'
  }
];

export const PAPER_CONTEXT = `
ABSTRACT_ In today's environment, overcoming problems with sharing files in cloud
technology is a difficult undertaking. To accomplish so, we're leveraging the Attribute-based
Cryptography format based on Cipher policy in Python, which we're encryption with the
pyAesCrypt library package. This is among the most popular encryption technologies. The
file sharing concepts are particularly significant in areas such as healthcare, military, etc.
where we need to keep confidential material secure and don't want to offer authorization to
all types of users. Instead, we choose secured form file sharing concepts. We will maintain
the data in a secure format using cloud computing technology during this procedure. We will
keep the data in encrypted and original versions by using the pyAesCrypt utility packages and
the block cypher algorithm. In addition, because the data server for the retail store is unstable,
we are going to collect the data file and store it in a safe manner by making use of a CSRF
(Cross-site Request Forgery) Middleware token. For the purpose of the current project, we
are utilising typical ways to attribute encryption in order to generate data in an encrypted
format by making use of the user's key. We are now compiling a list of all the attributes
linked with the information of our customers, which we will later have the option to encrypt
and decode. Therefore, in order to implement the Attribute Encryption standard Block cypher
approach, we will be making use of the pyAesCrypt package in this project.
`;
