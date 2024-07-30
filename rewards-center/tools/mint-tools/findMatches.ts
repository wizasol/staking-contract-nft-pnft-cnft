export const handler = (tribe = "Evo", trait = "Ancient") => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-var-requires, @typescript-eslint/no-unsafe-assignment
  const file = require("fs").readFileSync(
    `tools/data/knittables-Tribe-${tribe}.csv`,
    {
      encoding: "utf-8",
    }
  ) as string;
  const mintList = file.split(",\n");

  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-var-requires, @typescript-eslint/no-unsafe-assignment
  const file2 = require("fs").readFileSync(
    `tools/data/knittables-${trait}.json`,
    {
      encoding: "utf-8",
    }
  ) as string;
  const multiplierList = JSON.parse(file2) as {
    name: string;
    mint_address: string;
  }[];

  const overlap = multiplierList.filter(({ mint_address }) =>
    mintList.includes(mint_address)
  );

  console.log(overlap);

  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-var-requires, @typescript-eslint/no-unsafe-assignment
  require("fs").writeFileSync(
    `tools/data/knittables-Tribe-${tribe}-${trait}.csv`,
    overlap.map((o) => o.mint_address).join(",\n"),
    {
      encoding: "utf-8",
    }
  ) as string;
};

handler();
