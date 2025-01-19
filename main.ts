import fs from "fs";
import { createObjectCsvWriter } from "csv-writer";

type Charges = {
  id: number[];
  sessionID: string[];
  serialno: number[];
  wallboxID: string[];
  carID: string[];
  authType: string[];
  authData: string[];
  status: string[];
  startAt: string[];
  stopAt: string[];
  chargeTimeActive: number[];
  chargeTimeInactive: number[];
  dischargeTimeActive: number[];
  chargeCounterReadingStart: number[];
  chargeCounterReadingStop: number[];
  energyAll: string[];
  energySolar: string[];
  dischargeCounterReadingStart: number[];
  dischargeCounterReadingStop: number[];
  energyDischarged: number[];
  receiptData: string[];
  receiptSignature: string[];
  midEnergy: number[];
  midEnergyInconsistent: boolean[];
  midSessionOffline: boolean[];
  createdAt: string[];
  updatedAt: string[];
  dynamic: string[];
  chargePriceTotal: number[];
};

type ChargeData = {
  id: number;
  card: string;
  start: Date;
  energyAll: number;
  energySolar: number;
  energyExt: number;
};

type CardData = {
  [cardId: string]: Array<{ solar: number; total: number; ext: number }>;
};

const RESULTSFILE_NAME = "results.csv";
const CALCFILE_NAME = "calc.json";

const main = async () => {
  const rawData = fs.readFileSync("charges.json", "utf-8");
  const charges: Charges = JSON.parse(rawData);
  let chargeData: Array<ChargeData> = [];

  for (let index = 0; index <= charges.id.length; index++) {
    let chargeItem: ChargeData = {
      card: charges.authData[index],
      energyAll: parseFloat(charges.energyAll[index]),
      energySolar: parseFloat(charges.energySolar[index]),
      energyExt:
        parseFloat(charges.energyAll[index]) -
        parseFloat(charges.energySolar[index]),
      id: charges.id[index],
      start: new Date(charges.startAt[index]),
    };
    console.log(chargeItem);
    chargeData.push(chargeItem);
  }
  if (fs.existsSync(RESULTSFILE_NAME)) {
    fs.unlinkSync(RESULTSFILE_NAME);
  }
  const csvWriter = createObjectCsvWriter({
    path: RESULTSFILE_NAME,
    append: false,
    header: ["card", "energyAll", "energySolar", "energyExt", "id", "date"],
  });

  const filteredData = chargeData;

  csvWriter.writeRecords(filteredData);

  const energySummaryByCard: {
    [card: string]: {
      energyAll: number;
      energySolar: number;
      energyExt: number;
    };
  } = filteredData
    .reduce((acc, data) => {
      if (!acc[data.card]) {
        acc[data.card] = { energyAll: 0, energySolar: 0, energyExt: 0 };
      }
      acc[data.card].energyAll += data.energyAll;
      acc[data.card].energySolar += data.energySolar;
      acc[data.card].energyExt += data.energyExt;
      return acc;
    }, {} as { [card: string]: { energyAll: number; energySolar: number; energyExt: number } });

  console.log(energySummaryByCard);
  if (fs.existsSync(CALCFILE_NAME)) {
    fs.unlinkSync(CALCFILE_NAME);
  }
  fs.writeFileSync(CALCFILE_NAME, JSON.stringify(energySummaryByCard), {
    flush: true,
    encoding: "utf-8",
  });
};

await main();
