// Customer related interfaces
export interface CustomerData {
  mobileNumber: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  panNumber: string;
  aadharNumber: string;
  dob: string;
  gender: 'Male' | 'Female' | 'Other';
}

export interface ZipCodeData {
  zipCode: string;
  zipCodeValue: string;
  bflBranch: string;
  dob: string;
  gender: string;
  language: string;
  preferredLanguage?: string;
  poaAddressType?: string;
  expectDropdown?: boolean;
}

export interface PoiData {
  firstName: string;
  middleName?: string;
  lastName: string;
  poiType: string;
  poiNumber: string;
  gender: string;
  dob: string;
  employmentType: string;
}

export interface PoaData {
  residenceType: string;
  zipCode?: string;
  bflBranch?: string;
  addressLine1: string;
  addressLine2: string;
  addressLine3: string;
  areaLocality: string;
  landmark: string;
  city?: string;
  state?: string;
  poaType: string;
  poaNumber: string;
}

export interface ProductData {
  productName?: string;
  manufacturer?: string;
  modelName?: string;
  modelVariant?: string;
  modelColor?: string;
  invoiceAmount?: string;
  loanAmount?: string;
  unitPrice?: string;
  quantity?: string;
  imeiNumber?: string;
  schemeName?: string;
}

export interface AdditionalDetailsData {
  officePinCode: string;
  companyName: string;
  officeAddressLine1: string;
  officeAddressLine2: string;
  officeAddressLine3: string;
  officeAreaLocality: string;
  phoneNumberType: string;
  officeMobileNumber: string;
  employmentType: string;
  designation: string;
  monthlyIncome: string;
  nameOnCard: string;
}

export interface PersonalDetailsData {
  fatherName: string;
  motherName: string;
  alternateMobile: string;
  preferredLanguage: string;
  communicationLanguage: string;
  maritalStatus: string;
  qualification: string;
  mailingAddress: string;
}

export interface BankDetailsData {
  bankName: string;
  accountNumber: string;
  accountType: string;
  ifscCode?: string;
}

export interface OpportunityData {
  opportunityId: string;
  dealerName: string;
  productName: string;
  modelName: string;
  schemeName: string;
  invoiceAmount: string;
  loanAmount: string;
  stage: string;
}
