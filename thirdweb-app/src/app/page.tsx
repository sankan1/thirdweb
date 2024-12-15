"use client";

import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { getSigner } from "./client";
import contractConfig from "@/utils/contractConfig";
import {
  Button,
  Container,
  Grid,
  Paper,
  TextField,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Box,
} from "@mui/material";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import { DateTime } from "luxon";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";


export default function Home() {
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [priceEur, setPriceEur] = useState("");
  const [amount, setAmount] = useState("");
  const [priceEth, setPriceEth] = useState("0");
  const [deposit, setDeposit] = useState("0");
  const [expiryDate, setExpiryDate] = useState("");
  const [eurToEthRate, setEurToEthRate] = useState(0);
  const [activeOrders, setActiveOrders] = useState([]);
  const [matchedOrders, setMatchedOrders] = useState([]);

  // Fetch EUR to ETH conversion rate on component mount
  useEffect(() => {
    fetchEurToEthRate();
  }, []);

  const fetchEurToEthRate = async () => {
    try {
      const response = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=eur"
      );
      const data = await response.json();
      const rate = data?.ethereum?.eur;

      if (rate) {
        setEurToEthRate(1 / rate); // Conversion rate: 1 EUR to ETH
      }
    } catch (error) {
      console.error("Error fetching EUR to ETH rate:", error);
    }
  };

  // Calculate price in ETH and deposit when priceEur or amount changes
  useEffect(() => {
    if (priceEur && amount && eurToEthRate) {
      const priceInEth = parseFloat(priceEur) * eurToEthRate;
      setPriceEth(priceInEth.toFixed(6));

      const calculatedDeposit = priceInEth * 1.3; // 130% deposit
      setDeposit(calculatedDeposit.toFixed(6));
    } else {
      setPriceEth("0");
      setDeposit("0");
    }

    // Set expiry date to 3 months from now
    const futureDate = DateTime.now().plus({ months: 3 });
    setExpiryDate(futureDate.toLocaleString(DateTime.DATE_MED));
  }, [priceEur, amount, eurToEthRate]);

  useEffect(() => {
    const loadContract = async () => {
      try {
        const signer = await getSigner();
        const contract = new ethers.Contract(contractConfig.address, contractConfig.abi, signer);
        setContract(contract);
        const address = await signer.getAddress();
        setAccount(address);

        fetchActiveOrders();
        fetchMatchedOrders(address);
      } catch (error) {
        console.error("Error loading contract:", error);
      }
    };

    loadContract();
  }, []);

  const fetchActiveOrders = async () => {
    try {
      const response = await fetch("/api/active-orders");
      const data = await response.json();
      if (data.success) {
        setActiveOrders(data.activeOrders);
      }
    } catch (error) {
      console.error("Error fetching active orders:", error);
    }
  };

  const fetchMatchedOrders = async (userAddress: string) => {
    try {
      const response = await fetch(`/api/matched-orders?address=${userAddress}`);
      const data = await response.json();
      if (data.success) {
        setMatchedOrders(data.matchedOrders);
      }
    } catch (error) {
      console.error("Error fetching matched orders:", error);
    }
  };

  const handleCreateOrder = async () => {
    if (!contract || !account || !priceEur || !amount) {
      console.error("Missing required fields or contract instance.");
      return;
    }

    try {
      setLoading(true);

      // Convert EUR price to ETH using the conversion rate
      const priceInEth = parseFloat(priceEur) * eurToEthRate;
      console.log("Price in ETH:", priceInEth);

      // Convert price in ETH to Wei
      const priceInWei = ethers.utils.parseUnits(priceInEth.toFixed(18), "ether");
      console.log("Price in Wei:", priceInWei.toString());

      // Calculate deposit (130% of total price)
      const amountAsNumber = parseInt(amount);
      const totalPriceInWei = priceInWei.mul(amountAsNumber);
      const depositInWei = totalPriceInWei.mul(130).div(100);
      console.log("Total Price in Wei:", totalPriceInWei.toString());
      console.log("Deposit in Wei:", depositInWei.toString());

      // Call the smart contract to create the order
      const tx = await contract.createOrder(0, amountAsNumber, priceInWei, {
        value: depositInWei,
      });

      await tx.wait();

      // Extract the expiration timestamp (3 months from now)
      const expirationTimestamp = Math.floor(Date.now() / 1000) + 90 * 24 * 60 * 60;

      // Call the API to store the active order in the database
      await fetch("/api/active-orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          price: parseFloat(priceInEth.toFixed(6)),
          amount: amountAsNumber,
          expirationTimestamp,
          owner: account,
          deposit: parseFloat(ethers.utils.formatEther(depositInWei)),
        }),
      });

      alert("Order created successfully!");
      fetchActiveOrders();
    } catch (error) {
      console.error("Order creation failed:", error);
      alert(`Order creation failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };


  const handleBuyOrder = async (orderId: number, requiredDeposit: string) => {
    console.log("Order ID:", orderId);
    console.log("Required Deposit:", requiredDeposit);

    if (!contract || !account) {
      alert("Contract or account not available.");
      return;
    }

    try {
      setLoading(true);

      // Convert the deposit to Wei
      const depositInWei = ethers.utils.parseEther(requiredDeposit);
      console.log("Deposit in Wei:", depositInWei.toString());

      // Call the smart contract's acceptOrder function
      const tx = await contract.acceptOrder(orderId, {
        value: depositInWei,
        gasLimit: ethers.utils.hexlify(300000),
      });

      await tx.wait();

      alert("Order purchased successfully!");
      fetchActiveOrders();
      fetchMatchedOrders(account);
    } catch (error) {
      console.error("Purchase failed:", error);
      alert(`Purchase failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <Paper elevation={3} sx={{ padding: 2, marginTop: 2 }}>
        <Typography variant="h4" gutterBottom>
          Active and Matched Orders
        </Typography>

        {account && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              backgroundColor: "#f0f0f0",
              padding: "8px 16px",
              borderRadius: "8px",
              marginBottom: "20px",
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: "bold", color: "#555" }}>
              Connected Account:
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Typography variant="body1" sx={{ fontFamily: "monospace", marginRight: "8px" }}>
                {`${account.substring(0, 6)}...${account.substring(account.length - 4)}`}
              </Typography>
              <IconButton
                size="small"
                onClick={() => navigator.clipboard.writeText(account)}
                sx={{ color: "#1976d2" }}
              >
                <ContentCopyIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        )}


        <Grid container spacing={2} sx={{ marginBottom: 2 }}>
          <Grid item xs={6}>
            <TextField label="Price (EUR)" variant="outlined" fullWidth value={priceEur} onChange={(e) => setPriceEur(e.target.value)} />
          </Grid>
          <Grid item xs={6}>
            <TextField label="Amount (Liters)" variant="outlined" fullWidth value={amount} onChange={(e) => setAmount(e.target.value)} />
          </Grid>
          <Grid item xs={6}>
            <TextField label="Price in ETH" variant="outlined" fullWidth value={priceEth} InputProps={{ readOnly: true }} />
          </Grid>
          <Grid item xs={6}>
            <TextField label="Deposit (ETH)" variant="outlined" fullWidth value={deposit} InputProps={{ readOnly: true }} />
          </Grid>
          <Grid item xs={6}>
            <TextField label="Expiry Date" variant="outlined" fullWidth value={expiryDate} InputProps={{ readOnly: true }} />
          </Grid>
          <Grid item xs={12}>
            <Button variant="contained" color="primary" onClick={handleCreateOrder} disabled={loading}>
              {loading ? "Creating Order..." : "Create Active Order"}
            </Button>
          </Grid>
        </Grid>

        <Grid container spacing={4}>
          <Grid item xs={6}>
            <Typography variant="h6">Active Orders</Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Price (ETH)</TableCell>
                    <TableCell>Amount (Liters)</TableCell>
                    <TableCell>Expiry</TableCell>
                    <TableCell>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {activeOrders.map((order, i) => (
                    <TableRow key={i}>
                      <TableCell>{order.price}</TableCell>
                      <TableCell>{order.amount}</TableCell>
                      <TableCell>{DateTime.fromMillis(order.expirationTimestamp * 1000).toLocaleString(DateTime.DATETIME_SHORT)}</TableCell>
                      <TableCell>
                        <IconButton color="primary" onClick={() => handleBuyOrder(order.id, order.deposit.toString())} disabled={loading}>
                          <ShoppingCartIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>

          <Grid item xs={6}>
            <Typography variant="h6">Matched Orders</Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Type</TableCell>
                    <TableCell>Price (ETH)</TableCell>
                    <TableCell>Amount (Liters)</TableCell>
                    <TableCell>Expiry</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {matchedOrders.map((order: any, i: number) => {
                    // Determine if the current user is the owner or resolver
                    const orderType = order.owner.toLowerCase() === account?.toLowerCase() ? "Bid" : "Ask";

                    return (
                      <TableRow key={i}>
                        <TableCell>
                          <Chip label={orderType} color={orderType === "Bid" ? "primary" : "secondary"} />
                        </TableCell>
                        <TableCell>{order.price}</TableCell>
                        <TableCell>{order.amount}</TableCell>
                        <TableCell>
                          {DateTime.fromMillis(order.expirationTimestamp * 1000).toLocaleString(DateTime.DATETIME_SHORT)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>

        </Grid>
      </Paper>
    </Container>
  );
}





