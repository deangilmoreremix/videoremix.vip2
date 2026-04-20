export interface SalesCopy {
  tonality: string;
  whatItDoes: string;
  howItMakesMoney: string;
  whyBusinessesNeedIt: string;
}

export interface AppSalesData {
  [appId: string]: SalesCopy;
}

export const appSalesCopy: AppSalesData = {
  // Will be populated with generated content
};

export const validateSalesCopy = (copy: SalesCopy): boolean => {
  return !!(copy.tonality && copy.whatItDoes && copy.howItMakesMoney && copy.whyBusinessesNeedIt);
};