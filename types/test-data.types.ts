// Test data row interface - maps to Excel columns
export interface TestDataRow {
  environment: string;
  executionFlag: string;
  
  // URLs
  appurlcustomerlogin: string;
  appurladmin: string;
  emianywhererestrictionswitchlurl?: string;
  accounturl?: string;
  
  // FOS Credentials
  usernamecustomerlogin: string;
  passwordcustomerlogin: string;
  fosloginbutton: string;
  
  // Admin Credentials
  username: string;
  usernameadmin: string;
  password: string;
  passwordadmin: string;
  adminloginbutton: string;
  
  // Dealer
  dealervalue: string;
  
  // Common Labels
  mobilenumberlabel: string;
  searchbutton: string;
  proceedbuttonvalue: string;
  confirmbuttonvalue: string;
  savebuttonvalue: string;
  savelabel: string;
  editlabel?: string;
  valuelabel?: string;
  continuebuttonlabel?: string;
  
  // Page Names
  appstatuspagename: string;
  zipcodeverificationpagename: string;
  productsectionpagename: string;
  incomedeclarationpagename: string;
  kycpagename: string;
  poipagename: string;
  poapagename: string;
  surrogatedetailspagename: string;
  approvaldetailspagename: string;
  additionaldetailspagename: string;
  assetcartpagename: string;
  crosssellpagename?: string;
  emicardsectionpagename?: string;
  loansummarypagename?: string;
  bankdetailspagename?: string;
  dodetailspagename?: string;
  otherdetailspagename?: string;
  agreementpagename?: string;
  
  // ZipCode Fields
  zipcodelabel: string;
  zipcodevalue: string;
  bflbranchlabel: string;
  bflbranchvalue: string;
  doblabel: string;
  dobvalue: string;
  genderlabel: string;
  gendervalue: string;
  preferredcommunicationlanguagelabel: string;
  preferredcommunicationlanguagevalue: string;
  poaaddresstypelabel?: string;
  poaaddresstypevalue?: string;
  
  // Product Fields
  productname: string;
  modelnamevalue: string;
  invoiceamountlabel: string;
  invoiceamountvalue: string;
  loanamountlabel: string;
  loanamountvalue: string;
  schemenamevalue: string;
  incomeamountvalue: string;
  
  // KYC Fields
  kycoptionvalue: string;
  
  // POI Fields
  firstnamelabel: string;
  middlenamelabel: string;
  lastnamelabel: string;
  poitypelabel: string;
  poitypevalue: string;
  poinumberlabel: string;
  dateofbirthlabel: string;
  employmenttypelabel: string;
  employmenttypevalue: string;
  
  // POA Fields
  residencetypelabel: string;
  residencetypevalue: string;
  addressline1label: string;
  addressline2label: string;
  addressline3label: string;
  arealocalitylabel: string;
  landmarklabel: string;
  poatypelabel: string;
  poatypevalue: string;
  poanumberlabel: string;
  
  // Surrogate Fields
  processtypelabel: string;
  processtypevalue: string;
  creditprogramlabel: string;
  creditprogramvalue: string;
  checkapprovalbuttonlabel: string;
  
  // Additional Details Fields
  officepincodelabel?: string;
  officepincodevalue?: string;
  nameofcompanylabel?: string;
  nameofcompanyvalue?: string;
  officeaddressline1label?: string;
  officeaddressline2label?: string;
  officeaddressline3label?: string;
  officearealocalitylabel?: string;
  officephonenumbertypelabel?: string;
  officephonenumbertypevalue?: string;
  officemobilenumberlabel?: string;
  designationlabel?: string;
  designationvalue?: string;
  monthlyincomelabel?: string;
  monthlyincomevalue?: string;
  nameoncardlabel?: string;
  
  // Personal Details Fields
  fathernamelabel?: string;
  mothernamelabel?: string;
  alternatemobilenumberlabel?: string;
  preferredlanguagelabel?: string;
  preferredlanguagevalue?: string;
  maritalstatuslabel?: string;
  maritalstatusvalue?: string;
  qualificationlabel?: string;
  qualificationvalue?: string;
  preferredmailingaddresslabel?: string;
  preferredmailingaddressvalue?: string;
  
  // Bank Details Fields
  banknamelabel?: string;
  banknamevalue?: string;
  accounttypelabel?: string;
  accounttypevalue?: string;
  
  // DO Issue Fields
  ecsbarcodevalue?: string;
  filebarcodevalue?: string;
  
  // Admin Fields
  searchfieldlabel: string;
  customerextensionlabel?: string;
  ekycstatuslabel?: string;
  initiatedstatusvalue?: string;
  ekycresponsedatetimelabel?: string;
  detailslabel?: string;
  atostransactionstatuslabel?: string;
  oppcustomeridlabel?: string;
  customerlabel?: string;
  recordtypelabel?: string;
  cardnumberlabel?: string;
  customeridlabel?: string;
  integrationresponseslabel?: string;
  irresponsenamelabel?: string;
  statuslabel?: string;
  completedvalue?: string;
  ekyccolabel?: string;
  mobikwiklabel?: string;
  ekycdoblabel?: string;
  digilockerdoblabel?: string;
  ekycagedifferencelabel?: string;
  digilockeragedifferencelabel?: string;
  
  // EMI Anywhere Fields
  emianywherefunctionalitylabel?: string;
  deliveryaddress?: string;
  contactability?: string;
  declaredaddress?: string;
  emianywhereflag?: string;
  viewapprovaldetailslabel?: string;
  
  // API Fields
  params: string;
  tokenUrl: string;
  staticSalesforceURl: string;
  
  // Search Box
  searchboxlabel?: string;
  
  // Allow any additional fields
  [key: string]: string | undefined;
}

export interface TestSuiteConfig {
  specFile: string;
  description: string;
  tags: string;
  environment: string;
  executionFlag: string;
}
