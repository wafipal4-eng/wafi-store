export async function getPaymentsOverviewData(
    timeFrame?: "monthly" | "yearly" | (string & {}),
  ) {
    // Fake delay
    await new Promise((resolve) => setTimeout(resolve, 1000));
  
    if (timeFrame === "yearly") {
      return {
        received: [
          { x: 2020, y: 450 },
          { x: 2021, y: 620 },
          { x: 2022, y: 780 },
          { x: 2023, y: 920 },
          { x: 2024, y: 1080 },
        ],
        due: [
          { x: 2020, y: 1480 },
          { x: 2021, y: 1720 },
          { x: 2022, y: 1950 },
          { x: 2023, y: 2300 },
          { x: 2024, y: 1200 },
        ],
      };
    }
  
    return {
      received: [
        { x: "Jan", y: 0 },
        { x: "Feb", y: 20 },
        { x: "Mar", y: 35 },
        { x: "Apr", y: 45 },
        { x: "May", y: 35 },
        { x: "Jun", y: 55 },
        { x: "Jul", y: 65 },
        { x: "Aug", y: 50 },
        { x: "Sep", y: 65 },
        { x: "Oct", y: 75 },
        { x: "Nov", y: 60 },
        { x: "Dec", y: 75 },
      ],
      due: [
        { x: "Jan", y: 15 },
        { x: "Feb", y: 9 },
        { x: "Mar", y: 17 },
        { x: "Apr", y: 32 },
        { x: "May", y: 25 },
        { x: "Jun", y: 68 },
        { x: "Jul", y: 80 },
        { x: "Aug", y: 68 },
        { x: "Sep", y: 84 },
        { x: "Oct", y: 94 },
        { x: "Nov", y: 74 },
        { x: "Dec", y: 62 },
      ],
    };



  }


  export async function getTopChannels() {
    // Fake delay
  
    return [
      {
        name: "Google",
        visitors: 3456,
        revenues: 4220,
        sales: 3456,
        conversion: 2.59,
      },
      {
        name: "X.com",
        visitors: 3456,
        revenues: 4220,
        sales: 3456,
        conversion: 2.59,
      },
      {
        name: "Github",
        visitors: 3456,
        revenues: 4220,
        sales: 3456,
        conversion: 2.59,
        
      },
      {
        name: "Vimeo",
        visitors: 3456,
        revenues: 4220,
        sales: 3456,
        conversion: 2.59,
      },
      {
        name: "Facebook",
        visitors: 3456,
        revenues: 4220,
        sales: 3456,
        conversion: 2.59,
      },
    ];
  }


  export async function getCampaignVisitorsData() {
    // Fake delay
  
    return {
      total_visitors: 784_000,
      performance: -1.5,
      chart: [
        { x: "S", y: 168 },
        { x: "S", y: 385 },
        { x: "M", y: 201 },
        { x: "T", y: 298 },
        { x: "W", y: 187 },
        { x: "T", y: 195 },
        { x: "F", y: 291 },
      ],
    };
  }
  
  