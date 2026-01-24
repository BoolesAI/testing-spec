import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

const books = [
  {
    title: 'The Pragmatic Programmer',
    author: 'David Thomas, Andrew Hunt',
    isbn: '9780135957059',
    publicationDate: new Date('2019-09-13'),
    price: new Prisma.Decimal(49.99),
    inventoryQuantity: 25
  },
  {
    title: 'Clean Code',
    author: 'Robert C. Martin',
    isbn: '9780132350884',
    publicationDate: new Date('2008-08-01'),
    price: new Prisma.Decimal(39.99),
    inventoryQuantity: 30
  },
  {
    title: 'Design Patterns',
    author: 'Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides',
    isbn: '9780201633610',
    publicationDate: new Date('1994-10-31'),
    price: new Prisma.Decimal(54.99),
    inventoryQuantity: 15
  },
  {
    title: 'Refactoring',
    author: 'Martin Fowler',
    isbn: '9780134757599',
    publicationDate: new Date('2018-11-20'),
    price: new Prisma.Decimal(47.99),
    inventoryQuantity: 20
  },
  {
    title: 'Introduction to Algorithms',
    author: 'Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest, Clifford Stein',
    isbn: '9780262033848',
    publicationDate: new Date('2009-07-31'),
    price: new Prisma.Decimal(89.99),
    inventoryQuantity: 10
  },
  {
    title: 'You Don\'t Know JS Yet',
    author: 'Kyle Simpson',
    isbn: '9798602477429',
    publicationDate: new Date('2020-01-28'),
    price: new Prisma.Decimal(29.99),
    inventoryQuantity: 40
  },
  {
    title: 'JavaScript: The Good Parts',
    author: 'Douglas Crockford',
    isbn: '9780596517748',
    publicationDate: new Date('2008-05-01'),
    price: new Prisma.Decimal(24.99),
    inventoryQuantity: 35
  },
  {
    title: 'Node.js Design Patterns',
    author: 'Mario Casciaro, Luciano Mammino',
    isbn: '9781839214110',
    publicationDate: new Date('2020-07-29'),
    price: new Prisma.Decimal(44.99),
    inventoryQuantity: 18
  },
  {
    title: 'TypeScript in 50 Lessons',
    author: 'Stefan Baumgartner',
    isbn: '9783945749586',
    publicationDate: new Date('2020-10-01'),
    price: new Prisma.Decimal(39.00),
    inventoryQuantity: 22
  },
  {
    title: 'Web Development with Node and Express',
    author: 'Ethan Brown',
    isbn: '9781492053514',
    publicationDate: new Date('2019-11-26'),
    price: new Prisma.Decimal(49.99),
    inventoryQuantity: 28
  }
];

async function main() {
  console.log('Seeding database...');
  
  for (const book of books) {
    await prisma.book.upsert({
      where: { isbn: book.isbn },
      update: {},
      create: book
    });
  }

  console.log(`Seeded ${books.length} books`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
