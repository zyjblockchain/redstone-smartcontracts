import ArLocal from 'arlocal';
import Arweave from 'arweave';
import { GQLResultInterface } from '@smartweave';
import { CreateTransactionInterface } from 'arweave/node/common';

const arlocal: ArLocal = new ArLocal(1985, false);
const arweave = Arweave.init({
  host: 'localhost',
  port: 1985,
  protocol: 'http'
});

const query = `query Transactions($blockFilter: BlockFilter!) {
    transactions(block: $blockFilter, sort: HEIGHT_ASC) {
      pageInfo {
        hasNextPage
      }
      edges {
        node {
          id
          owner { address }
          recipient
          tags {
            name
            value
          }
          block {
            height
            id
            timestamp
          }
          fee { winston }
          quantity { winston }
          parent { id }
        }
        cursor
      }
    }
  }`;

async function main() {
  await arlocal.start();
  // await mine();

  console.log('Network block height before adding transactions:', (await arweave.network.getInfo()).height);

  await postTransaction();

  console.log('Network block height after adding transactions:', (await arweave.network.getInfo()).height);

  const result = await queryTransactions(1, 1);
  console.log(
    result.edges.map((e) => {
      return e.node;
    })
  );
  console.log('Result length should be 1, is:', result.edges.length);

  await arlocal.stop();
}

main().catch((e) => {
  console.log(e);
});

async function queryTransactions(minBlockHeight: number, maxBlockHeight: number) {
  const variables: ReqVariables = {
    blockFilter: {
      min: minBlockHeight,
      max: maxBlockHeight
    }
  };

  const response = await arweave.api.post('graphql', {
    query,
    variables
  });

  const data: GQLResultInterface = response.data;
  const txs = data.data.transactions;

  return txs;
}

async function postTransaction() {
  console.log('Posting transaction...');
  const tx = await createTx();
  await arweave.transactions.post(tx);
  await mine();
}

async function createTx() {
  const options: Partial<CreateTransactionInterface> = {
    data: Math.random().toString().slice(-4)
  };
  const wallet = await arweave.wallets.generate();
  const transaction = await arweave.createTransaction(options, wallet);
  transaction.addTag('Test', 'Foo');
  await arweave.transactions.sign(transaction, wallet);
  return transaction;
}

async function mine() {
  await arweave.api.get('mine');
}

interface ReqVariables {
  blockFilter: {
    min: number;
    max: number;
  };
}
