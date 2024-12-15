import { ethers } from "ethers";

export const getProvider = async () => {
  if ((window as any).ethereum) {
    const provider = new ethers.providers.Web3Provider((window as any).ethereum);
    await provider.send("eth_requestAccounts", []);
    return provider;
  } else {
    throw new Error("Please install MetaMask!");
  }
};

export const getSigner = async () => {
  const provider = await getProvider();
  return provider.getSigner();
};
