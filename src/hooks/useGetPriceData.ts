import { useEffect, useState } from 'react'
import BigNumber from 'bignumber.js'
import { useMulticallContract } from './useContract'
import priceContracts from './priceContracts'
import ERC20_INTERFACE from '../constants/abis/erc20'
import useGetPriceData2 from '../components/Menu/getPrice'


type ApiResponse = {
  prices: {
    [key: string]: string
  }
  update_at: string
}

/**
 * Due to Cors the api was forked and a proxy was created
 * @see https://github.com/pancakeswap/gatsby-pancake-api/commit/e811b67a43ccc41edd4a0fa1ee704b2f510aa0ba
 */
const api = 'https://api.coingecko.com/api/v3/simple/price?ids=binancecoin&vs_currencies=usd'


const useGetPriceData = () => {

  const thePrice = useGetPriceData2();

  // @ts-ignore
  localStorage.setItem('thePrice', thePrice);


  const [data, setData] = useState<number>(0)

  const multicallContract = useMulticallContract();


  useEffect(() => {

    const fetchData = async () => {
        // @ts-ignore
      try {
        
        if(multicallContract){
          
          const {cakeAddress, busdAddress, lpAddress} = priceContracts;
          const calls = [
            [cakeAddress, ERC20_INTERFACE.encodeFunctionData("balanceOf", [lpAddress])],
            [busdAddress, ERC20_INTERFACE.encodeFunctionData("balanceOf", [lpAddress])],
          ];
          const [resultsBlockNumber, result] = await multicallContract.aggregate(calls);
          const [cakeAmount, busdAmount] = result.map(r=>ERC20_INTERFACE.decodeFunctionResult("balanceOf", r));
          const cake = new BigNumber(cakeAmount);
          const busd = new BigNumber(busdAmount);
          const myPrice = localStorage.getItem('thePrice');

          // @ts-ignore
          const cakePrice = busd.div(cake).toNumber()*myPrice;
          setData(cakePrice)
        }
      } catch (error) {
        console.error('Unable to fetch price data:', error)
      }
    }

    fetchData()
  }, [multicallContract])

  return data
}

export default useGetPriceData
