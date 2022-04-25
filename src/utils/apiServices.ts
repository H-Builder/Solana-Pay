import config from './config';
import { UserStore } from "../stores/UserStore";

const kadoApiRequest = async (
  endpoint: string,
  method: string,
  body: object | null = null,
  needsAuth = true,
  contentType: string | null = 'application/json',
) => {
  let headers: HeadersInit = {
    'strict-transport-security': 'max-age=63072000; includeSubdomains; preload',
    'content-security-policy':  "default-src 'none'; img-src 'self'; script-src 'self'; style-src 'self'; object-src 'none'; frame-ancestors 'none'; ancestors 'self ';",
    'x-content-type-options': 'nosniff',
    'x-frame-options': 'DENY',
    'x-xss-protection': '1; mode=block',
  };
  if (needsAuth) {
    const userStore = new UserStore();
    const auth = userStore.getAuth();
    const refreshBuffer = 10; // seconds
    
    // If we're within the buffer time of expiring, refresh to account for any latency that could occur on the backend
    if (auth && auth.exp < (Date.now() / 1000 + refreshBuffer)) {
      try {
        const refreshed = await refreshToken(auth.userId, auth.token.refreshToken, auth.apiKey);
        if (refreshed.success) {
          userStore.setAuth(refreshed.data.token);
          userStore.setIsLoggedIn(true);
        } else {
          userStore.setIsLoggedIn(false);
        }
      } catch (e) {
        userStore.setIsLoggedIn(false);
      }
    }
    
    headers = {
      ...headers,
      'Authorization': `Bearer ${userStore.getJwt()}`,
    };
  }
  if (contentType) {
    headers = {
      ...headers,
      'Content-Type': contentType
    }
  }
  
  const apiResponse = await fetch(`${config.kadoClient.url}${endpoint}`, {
    method,
    body: body && JSON.stringify(body),
    headers
  });
  
  return await apiResponse.json();
}

const getCountry = async () => {
  const countryRes = await fetch('https://get.geojs.io/v1/ip/country.json');
  const country = await countryRes.json();
  return country;
}

export const refreshToken = async (userId: string, refreshToken: string, apiKey: string) => (
  await kadoApiRequest('/v1/user/auth/refresh', 'POST', { userId, refreshToken, apiKey }, false)
);

const getTransactionByAmount = async (userId: string, amount: number) => (
  await kadoApiRequest(`/v1/user/${userId}/order/${amount}`, 'GET')
);

export interface ICreateOrderRequest {
  userId?: string; // TODO: Create unique identifier for tracking / support
  shippingFee: number;
  taxFee: number;
  ustPriceTotal?: string;
  terraTx?: any;
  solanaTx?: any;
  purchaseMethod?: string;
  blockchain?: {
    network?: string;
    method?: string;
    origin?: string;
  },
  giftCard?: {
    id: string
  }
  exchangeRate: number;
}

export interface ICreateOrderResponse {
  success: boolean;
  message: string;
  data?: {
    orderId?: string;
    hostedUrl?: string;
  }
}

const createTransaction = async (blockchain: string) => (
  await kadoApiRequest('/v1/cart/create-tx', 'POST', { blockchain })
);

const checkTransactionStatus = async (address: string) => (
  await kadoApiRequest(`/v1/cart/tx-status?address=${address}`, 'GET')
);

const createOrder = async (data: ICreateOrderRequest): Promise<ICreateOrderResponse> => (
  await kadoApiRequest(`/v1/order`, 'POST', data)
);

const getTerraTransactions = async (account: string) => {
  const mantleUrl = config.lcdClient.url;
  const apiResponse = await fetch(`${mantleUrl}/v1/txs?offset=0&limit=100&account=${account}`, {
    method: 'GET'
  });
  const transactions = await apiResponse.json();
  return transactions;
};

const getSolanaTransactions = async (address: string) => {
  const mantleUrl = config.solana.url;
  const apiResponse = await fetch(`${mantleUrl}/account/token/txs?address=${address}`, {
    method: 'GET'
  });
  const transactions = await apiResponse.json();
  return transactions;
};

const currencyConversion = async (amount: number, fromCurrency: string, toCurrency: string): Promise<any> => {
  let query = fromCurrency + '_' + toCurrency;
  const apiResponse = await fetch(`https://api.currconv.com/api/v7/convert?q=${query}&compact=ultra&apiKey=${config.conversion.currencyApiKey}`, {
    method: 'GET'
  });
  const conversion = await apiResponse.json();
  
  if (conversion) {
    let convertedAmount = conversion[query] * amount;
    convertedAmount = Math.round((convertedAmount * 100) / 100);
    return { amount: convertedAmount, rate: conversion[query].toFixed(4)  };
  } 
}

const querySalesTax = async (code: string) => (
  await kadoApiRequest(`/v1/cart/sales-tax?zipcode=${code}`, 'GET')
);

export {
  getCountry,
  createTransaction,
  checkTransactionStatus,
  querySalesTax,
  createOrder,
  getTransactionByAmount,
  getTerraTransactions,
  getSolanaTransactions,
  currencyConversion,
};
