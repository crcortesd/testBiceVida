import fetch from "isomorphic-unfetch";

const lifeInsuranceValues = {
  noSons: 0.279,
  oneSon: 0.4396,
  twoOrMoreSons: 0.5599,
};
const dentalInsuranceValues = {
  noSons: 0.12,
  oneSon: 0.195,
  twoOrMoreSons: 0.248,
};

export const calculatePolicyValue = async () => {
  const companyEmployeeInformationPromise = await fetch(
    "https://dn8mlk7hdujby.cloudfront.net/interview/insurance/policy",
    { method: "GET", headers: { "Content-Type": "application/json" } }
  );
  const {
    policy: {
      workers,
      has_dental_care: dentalCare,
      company_percentage: companyPercentage,
    },
  } = await companyEmployeeInformationPromise.json();
  const formattedPercentage = companyPercentage / 100;
  let totalCompanyCost = 0;
  const workerInformation = workers.reduce((accumulator, worker, index) => {
    const { age, childs } = worker;
    let insuranceValueKey = "noSons";
    if (childs === 1) insuranceValueKey = "oneSon";
    else if (childs >= 2) insuranceValueKey = "twoOrMoreSons";

    const lifeInsuranceCost = lifeInsuranceValues[insuranceValueKey];
    const dentalInsuranceCost = dentalInsuranceValues[insuranceValueKey];

    const workerTotaCost = dentalCare
      ? lifeInsuranceCost + dentalInsuranceCost
      : lifeInsuranceCost;
    const companyWorkerCost = workerTotaCost * formattedPercentage;
    const workerCopayment = workerTotaCost * (1 - formattedPercentage);

    if (age <= 65) totalCompanyCost += companyWorkerCost;
    accumulator.push({
      ...worker,
      workerCopayment:
        age <= 65 ? workerCopayment.toFixed(5) : workerTotaCost.toFixed(5),
    });
    return accumulator;
  }, []);
  const companyData = {
    workerInformation,
    totalCompanyCost: totalCompanyCost.toFixed(5),
  };
  return { status: 200, body: JSON.stringify(companyData, null, 2) };
};
