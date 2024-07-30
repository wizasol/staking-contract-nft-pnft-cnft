const { writeFile, writeFileSync } = require("fs");
const IDL = require("./sdk/idl/solana_nft_programs_rewards_center_idl");

const snakeCase = (str) =>
  str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);

const links = [
  ["stake_entry.pool", "stake_pool.address"],
  ["stake_authorization_record.pool", "stake_pool.address"],
  ["reward_distributor.stake_pool", "stake_pool.address"],
  ["reward_entry.reward_distributor", "reward_distributor.address"],
  ["stake_booster.stake_pool", "stake_pool.address"],
  ["receipt_manager.stake_pool", "stake_pool.address"],
  ["receipt_entry.stake_entry", "stake_entry.address"],
  ["reward_receipt.receipt_entry", "receipt_entry.address"],
  ["reward_receipt.receipt_manager", "receipt_manager.address"],
];

const renderValue = (v) => {
  if (typeof v === "string") {
    return v;
  }
  if (typeof v === "object" && "option" in v) {
    return `Opt(${v.option})`;
  }
  if (typeof v === "object" && "vec" in v) {
    return `${v.vec}[]`;
  }
  return v.toString();
};

const main = () => {
  const outPath = `./DIAGRAM.txt`;
  writeFile(outPath, "", function () {
    console.log(`[reset] ${outPath}`);
  });

  for (let i = 0; i < IDL.accounts.length; i++) {
    const { name: accountName, type } = IDL.accounts[i];
    const t = `
Table ${snakeCase(accountName).slice(1)} {
  address publicKey [pk]
  ${type.fields
    .map(({ name: field, type }) => {
      const link = links.find(
        ([src]) =>
          src === `${snakeCase(accountName).slice(1)}.${snakeCase(field)}`
      );
      return `${snakeCase(field)} ${renderValue(type)} ${
        link ? `[ref: > ${link[1].toString()}]` : ""
      }`;
    })
    .join("\n  ")}
}
`;
    writeFileSync(outPath, t, {
      flag: "a+",
    });
  }
};

main();
