const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');

const client = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: 'file:./dev.db' }),
});

const rawData = [
  { name: "MAIKON ALVES SANTOS FARIA", val: 84 },
  { name: "MARIA FERNANDA SOUSA DE ANDRADE", val: 80 },
  { name: "IRFLEY ANDRADE DE OLIVEIRA", val: 84 },
  { name: "HEITOR SOUSA DE ANDRADE", val: 84 },
  { name: "ARTUR SOUSA DE ANDRADE", val: 139 },
  { name: "LIVIA SOARES", val: null },
  { name: "GIANNA FARCHI FARIA", val: 100 },
  { name: "MARIA VALENTINA PEREIRA FREITAS", val: 139 },
  { name: "THÉO CARVALHO SOARES", val: null },
  { name: "NICOLLAS GABRIEL GOUVÊA", val: 100 },
  { name: "NATANAEL PEDRO FERREIRA", val: 100 },
  { name: "SAMUEL PEDRO FERREIRA", val: 100 },
  { name: "NICKOLAS SILVA ARAUJO", val: 139 },
  { name: "RAFAEL FERREIRA GALHARDO", val: 109 },
  { name: "ARTHUR FERREIRA SILVA", val: 90 },
  { name: "MATEUS LELLIS DOS SANTOS", val: 100 },
  { name: "CAIO OLIVEIRA SOARES", val: 150 },
  { name: "BENÍCIO BRITO DE OLIVEIRA", val: 109 },
  { name: "RAFAEL FINOTTI CINTRA", val: 100 },
  { name: "PEDRO SILVA MIGLIORINI", val: 149 },
  { name: "HEITOR FINOTTI CINTRA", val: 100 },
  { name: "JACOB AMBROSIO KOSTIN", val: 139 },
  { name: "JULIO OLIVEIRA DEL POENTE", val: 100 },
  { name: "ANTONI DINIZ ANDRADE VOGADO", val: 139 },
  { name: "LUCCA BRATORE MAXIMO", val: 139 },
  { name: "MURILO TEIXEIRA CARDOSO", val: 125 },
  { name: "MIGUEL TEIXEIRA CARDOSO", val: 125 },
  { name: "VALENTINA LIMA TEIXEIRA", val: 109 },
  { name: "CALEEBE DE SOUSA LOPES", val: 84 },
  { name: "RAFAELA YASMINA SILVA DE SOUSA", val: 139 },
  { name: "ALESSANDRO WANDEIR PRADO DE PAULA", val: 139 },
  { name: "HENRIQUE MANTOVANI SILVA MATOS", val: 139 },
  { name: "AGATHA BEATRIZ RAMOS PIO PRADO", val: 139 },
  { name: "ANA LAURA CORREA", val: 84 },
  { name: "BRIGIDA CUSTOSSA", val: 84 },
  { name: "MAICON ALVES SANTOS DE FARIA", val: 84 },
  { name: "TALLES EDUARDO DOS SANTOS", val: 139 },
  { name: "THAIS OLIVEIRA SILVA RIBEIRO", val: 84 },
  { name: "CAROLINA VENTRESCHE DEIENNO PINHAL", val: 84 },
  { name: "DENIS LEMOS DE MORAIS RODRIGUES", val: 100 },
  { name: "IZABELA ROSA SANTOS", val: 84 },
  { name: "SOPHIA CAROLINE SILVA CASTRO", val: 84 },
  { name: "ANA CAROLINA DE SOUZA SILVA", val: 84 },
  { name: "LUIZ FELIPE SCHENETZLER SILVA", val: null },
  { name: "DIEGO CORREA OLIVEIRA", val: 84 },
  { name: "HEITOR FERREIRA JUSTINO", val: null },
  { name: "THEO", val: 139 },
];

const femaleNames = new Set([
  "MARIA FERNANDA SOUSA DE ANDRADE",
  "LIVIA SOARES",
  "GIANNA FARCHI FARIA",
  "MARIA VALENTINA PEREIRA FREITAS",
  "VALENTINA LIMA TEIXEIRA",
  "RAFAELA YASMINA SILVA DE SOUSA",
  "AGATHA BEATRIZ RAMOS PIO PRADO",
  "ANA LAURA CORREA",
  "BRIGIDA CUSTOSSA",
  "THAIS OLIVEIRA SILVA RIBEIRO",
  "CAROLINA VENTRESCHE DEIENNO PINHAL",
  "IZABELA ROSA SANTOS",
  "SOPHIA CAROLINE SILVA CASTRO",
  "ANA CAROLINA DE SOUZA SILVA",
]);

async function run() {
  console.log(`Starting registration of ${rawData.length} students...`);
  let createdCount = 0;
  let gympassCount = 0;
  let monthlyCount = 0;

  for (const item of rawData) {
    const isGympass = item.val === 84;
    const gender = femaleNames.has(item.name) ? "FEMININO" : "MASCULINO";
    const paymentType = isGympass ? "GYMPASS" : "MENSALIDADE";
    const monthlyFee = isGympass ? 0 : (item.val || 0);
    const gympassCheckinValue = isGympass ? 84 : 0;

    // Check if student with this name already exists
    const existing = await client.student.findFirst({
      where: { name: item.name },
    });

    if (existing) {
      console.log(`Student already exists: ${item.name}, updating...`);
      await client.student.update({
        where: { id: existing.id },
        data: {
          paymentType,
          monthlyFee,
          gympassCheckinValue,
          status: "ATIVO",
        },
      });
    } else {
      await client.student.create({
        data: {
          name: item.name,
          gender,
          birthDate: null,
          phone: "",
          email: "",
          beltRank: "BRANCA",
          beltSize: "",
          status: "ATIVO",
          paymentType,
          monthlyFee,
          gympassCheckinValue,
          dueDay: 10,
        },
      });
      createdCount++;
    }

    if (isGympass) gympassCount++;
    else monthlyCount++;
  }

  const total = await client.student.count();
  console.log(`Done! Created: ${createdCount}, Gympass: ${gympassCount}, Mensalidade: ${monthlyCount}, Total in DB: ${total}`);
}

run()
  .catch((e) => {
    console.error("Error inserting students:", e);
    process.exit(1);
  })
  .finally(() => client.$disconnect());
