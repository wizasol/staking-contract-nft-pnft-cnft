import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import {
    Connection,
    Keypair,
    PublicKey,
} from '@solana/web3.js';
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import { MarinadeForkingSmartContract } from '../target/types/marinade_forking_smart_contract';

const program = anchor.workspace.MarinadeForkingSmartContract as Program<MarinadeForkingSmartContract>;

const payer = Keypair.fromSecretKey(bs58.decode("5BrUQk416xSy4xbHZq6jXb2JcVA8iRnPNJJr3NZv2wukMhwB39ndpe9eaCXmuFLxzkVUYXbdCB9ydeJkhKCGhnkm"));
const connection = new Connection("https://devnet.helius-rpc.com/?api-key=f74ec75c-56ba-49df-b67b-71637bf8d115"); // Change to your localnet RPC

const stateAccount =
    Keypair.fromSecretKey(
        bs58.decode("5ciADQAP7R4hbVoEaeXZBqQunPLLogdjehxe3GKMDWeQAGeP3HoHYQDEDGQ39imU8mYcmwBStBuS6ABHF1HmTt9L")
    )

const stakeList =
    Keypair.fromSecretKey(
        bs58.decode("2wALk2B3NHBqGpeeqWhaKajbgaEjnHU87YLsrP1ruUG1AUNRdMn7wv9cw2DoNDu7zjrPzq7QNsysULf9vRXrLBiJ")
    )

const validatorList =
    Keypair.fromSecretKey(
        bs58.decode("2raZxkMxd336vePRzCADxM1XrkQHnpaveazsauGnhMWVaeRdV6pBJaXep2SWQXDQtg2ZcD3f6qf1eKVqeC8p8m5y")
    )

const operationalSolAccount =
    Keypair.fromSecretKey(
        bs58.decode("31bbDQdJYVMmvEtR9keKoCw6GaPBHjFesFUtZRoLs5fSxcfdnQJE3qocPemjkDQNx2weTmjncywmWn5hxBNpob9y")
    )

const authorityAcc =
    Keypair.fromSecretKey(
        bs58.decode("415y7MXrf6gY9XHvMMua3bWAo4syX2d5WqvPdJFzCoJqYqivMri4kyVcK22KZ6v8sJYPYGjPDSU4SFdMtc1ND1gT")
    )

const stakeAuthority = Keypair.fromSecretKey(
    bs58.decode("4DwfHUiQjwKHZndRnvjk5VN2UFU4swNsRoujbQih8pKqmXnjyBENPoZtCvPdjFyfkERG8w1ED1q5V4K7m9VgePs7")
)
const stakeAccount = Keypair.fromSecretKey(
    bs58.decode("2rxBQ6fR6YCnHhinmn3D25sTFdPNMXCuofbfwCaT6GQSaQhQt4o2f5yxKgGAntBwY1inZa3ZbcPUSucrsHZCgaz6")
)
// const stakeAccount1 = Keypair.fromSecretKey()

const msolMint = new PublicKey("2mvRrWtLKB5rWFd74c2hhbMpz1izn4upDyrxejMYPxZy")
const lpMint = new PublicKey("Bu7ZehQtv7tv4CwMMZG6y22pUqumzpBvWFqmNPvxUtGk")

const mint_to = new PublicKey("AKToWp69enbyCdBuuWTgGqdxtiavS1Fcv6ZYL8ZbADnz")
const mSolLeg = new PublicKey("75bK6919EwLYuw8WsBgSXwrGgAvarymqzU65hyF5MH9Z")
const treasuryMsolAccount = new PublicKey("Eb7FhgmUc2DnQnnFBG2n5tGJUnp4DgKn14i6jJc311sq")

const [authorityMsolAcc] = PublicKey.findProgramAddressSync([stateAccount.publicKey.toBuffer(), Buffer.from("st_mint")], program.programId);
const [authorityLpAcc] = PublicKey.findProgramAddressSync([stateAccount.publicKey.toBuffer(), Buffer.from("liq_mint")], program.programId);
const [reservePda] = PublicKey.findProgramAddressSync([stateAccount.publicKey.toBuffer(), Buffer.from("reserve")], program.programId);
const [solLegPda] = PublicKey.findProgramAddressSync([stateAccount.publicKey.toBuffer(), Buffer.from("liq_sol")], program.programId);
const [authorityMSolLegAcc] = PublicKey.findProgramAddressSync([stateAccount.publicKey.toBuffer(), Buffer.from("liq_st_sol_authority")], program.programId);
const [stakeDepositAuthority] = PublicKey.findProgramAddressSync([stateAccount.publicKey.toBuffer(), Buffer.from("deposit")], program.programId)
const [stakeWithdrawAuthority] = PublicKey.findProgramAddressSync([stateAccount.publicKey.toBuffer(), Buffer.from("withdraw")], program.programId);

const voteAccount = [
    new PublicKey("HRACkkKxJHZ22QRfky7QEsSRgxiskQVdK23XS13tjEGM"),
    new PublicKey("A4VQNjqrBRe764oL4p6HJh3cpAaDFAfR3rtmgiSixJxG"),
    new PublicKey("3Mwzga2VZ5w1ojxA5DVNxQFu52txcwW3BAzGadRASDEp"),
    new PublicKey("AUANaDymQz8UkaNTyUDjo2C6Cx4HpwH1su7P7H8wQUqZ"),
    new PublicKey("Dy8u6dni4NWAnvLNAXAWQq2BGpcZijktP8Zuu1mF33rz"),
    new PublicKey("5121ko4AJS8sT3pMh4yHU2Kb2n6DArMFKAT4GPch5JNn"),
    new PublicKey("A2zrTuz1bGw4x4dCRkR7KrYesixzf1VfmHK7m31LYFHg"),
    new PublicKey("82dD6DH2Qh33GJ7mFMZzy4ijD97rdh6n77gTmPVBTd2Q"),
    new PublicKey("Gmt4QvNWmv682K2y94YWeNve9zJUKnfsZw5DFuPninhJ"),
    new PublicKey("EeQtHJNyJoqFLVBq62HsKvn5XcCUJdvAVBU6a5mPAWoN"),
    new PublicKey("3FggjKnubFMaLqUUaasyQmU3Kv6yJ6GLEQfoMfnxS3kK"),
    new PublicKey("F2UsSsRHezY1U4h8FWMmWHkgyVd8r5hVVPNXViod9ZnJ"),
    new PublicKey("FygaJXZXcFDSF7i6a6mxrHgyamc7BQRP23vxuqTaurxA"),
    new PublicKey("3cQB9y9LPggD1Qr6o2qNLqyFPx3LMbdAumWYWtJNRQr4"),
    new PublicKey("9k4naWewx8T7kkyMvC3cBHmbgeZYf5Qu9GCcXj6TxFsp"),
    new PublicKey("58oFFYp52MERc2RztpyRKQYSXS4EL6aprCyV5roPEpj5"),
    new PublicKey("EhqwmGPrhPvwMTMBXjh3Zx4Lt2Sum2JzMe4HD9sMaoH8"),
    new PublicKey("HCiswqaBd98caxxMFTbEbVz83VsYm3tGcdgQjY4Vrn3S"),
    new PublicKey("BQ6CjacZfw9Nxs6hGt2s784jVagJEbDY2GRVRPvsRsuC"),
    new PublicKey("AWFyzTENewEEkYbzwP5mrNUMePmAQ2566oDAWKiVQhMh"),
    new PublicKey("B9bcsHz4VSj9HYzif97RwmjupK7kA8r2wvEw66VJce2H"),
    new PublicKey("6t8zQcB1ifdhjkAbk3kKdKhkPvkcNnqhQhYSnAS73FBe"),
    new PublicKey("HkEL3Z81qya6Z3tyicLA8efD5tZw6teV13VqyT856sY1"),
    new PublicKey("C1eDhA4VnCcAqFm4LoJ86TPLmCaXQ5dLbTSLh7tTNVi4"),
    new PublicKey("CU7kyWRGaWDQ3NAX4PGiq2TJbnksPw6NveJEANX3F9f1"),
    new PublicKey("3Ca2zgp1CZKdxThFm8FigeWHpYNroA9eemsuUMHYXtBd"),
    new PublicKey("9uTPyLrJnWa5g2EHeEFFMQxJr6VNGBMdQ5te3Q4mYTZe"),
    new PublicKey("JC1fVJtcPb7NiU5WVjK8VccVNeRk1xZggnAS6tWGPbQ9"),
    new PublicKey("Gtw66q18wb1E1XS9XUMzfAEViusTpqfBypg3tnbJaQiZ"),
    new PublicKey("D13oovoACm6DWGPz43kLgcpLEdpQE4ofPd5RV1PN2e4L"),
    new PublicKey("DDgaGFWktZDAzP2GVGH7RknNtAuhq8Pdi4DLtV5epTdP"),
    new PublicKey("7BN2ep6pc7g3gCMycv9yTpZfEgccHuu7EupahynpbAqM"),
    new PublicKey("5MrQ888HbPthezJu4kWg9bFfZg2FMLtQWzixQgNNX48B"),
    new PublicKey("DNTc4P9ngY51Uc8hXSjhJdZdLTxyx7j1N1GbfXjVkLPr"),
    new PublicKey("5QtjYNhy3PXcpBQaeM2UgcVricKBQn85hY3HSKvEWBVF"),
    new PublicKey("E4bsrmwD2SvNgKMWijmjb6fmHELfajPDTynEzfuKD1VM"),
    new PublicKey("DUwHuCm3QuJFcFKoFfz3XkUQtcHeWnFQPEkcfRtNxNjV"),
    new PublicKey("ECuwzjAEg7kPVBmmW7xa6Wz9xkK5pbN8cTn4SCdp5PPp"),
    new PublicKey("5iic7eCs3tGKQvscTaY3Lb8mr6HvogpZKoxgxazxdiCA"),
    new PublicKey("Dm9QasrFGeYNmsjo9VFv8uCGxKn9CxruCSkGFrMC4gEP"),
    new PublicKey("GkqYQysEGmuL6V2AJoNnWZUz2ZBGWhzQXsJiXm2CLKAN"),
    new PublicKey("FwR3PbjS5iyqzLiLugrBqKSa5EKZ4vK9SKs7eQXtT59f"),
    new PublicKey("28rDknpdBPNu5RU9yxbVqqHwnbXB9qaCigw1M53g7Nps"),
    new PublicKey("4QUZQ4c7bZuJ4o4L8tYAEGnePFV27SUFEVmC7BYfsXRp"),
    new PublicKey("DSQ5BLBM6UcuWP2SNpmf3TJeMbqbwTFGzVqFGufyNCgk"),
    new PublicKey("2u83Dx5qPV4QnujjJQv8v2SoqG1ixuAxPK5Jwhtkovd1"),
    new PublicKey("7AETLyAGJWjp6AWzZqZcP362yv5LQ3nLEdwnXNjdNwwF"),
    new PublicKey("23AoPQc3EPkfLWb14cKiWNahh1H9rtb3UBk8gWseohjF"),
    new PublicKey("5ZWgXcyqrrNpQHCme5SdC5hCeYb2o3fEJhF7Gok3bTVN"),
    new PublicKey("i7NyKBMJCA9bLM2nsGyAGCKHECuR2L5eh4GqFciuwNT"),
    new PublicKey("vgcDar2pryHvMgPkKaZfh8pQy4BJxv7SpwUG7zinWjG"),
]
// 8 
export {
    payer,
    connection,
    stateAccount,
    stakeList,
    validatorList,
    operationalSolAccount,
    authorityAcc,
    msolMint,
    mSolLeg,
    lpMint,
    treasuryMsolAccount,
    voteAccount,
    stakeAuthority,
    mint_to,
    stakeAccount,
    authorityMsolAcc,
    reservePda,
    authorityLpAcc,
    authorityMSolLegAcc,
    solLegPda,
    stakeDepositAuthority,
    stakeWithdrawAuthority,
}