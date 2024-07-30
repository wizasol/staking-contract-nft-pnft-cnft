// base - User.find()
// base - User.find(name: {"Singh"})
import User from '../models/user';
import { MAX_QUERY_LIMIT } from './constants';

// bigQ - //search=singh&role=1&views[gte]=4000
// &views[lte]=9999&page=2&limit=5

// Possibile use can be :
/* const totalcountUser = await User.countDocuments();

    const usersObj = new WhereClause(User.find(), req.query)
    .search()
    .filter();

    let users = await usersObj.base;
    const filteredUsersNumber = users.length;

    usersObj.pager();
    users = await usersObj.base.clone();

    res.status(200).json({
        success: true,
        users,
        filteredUsersNumber,
        totalcountUser,
    });
*/
class WhereClauseUser {
  base: any;

  totalcountUser: any;

  bigQ: any;

  totalPages = -1;

  filteredUsersNumber = -1;

  page = -1;

  previousPage = -1;

  nextPage = -1;

  constructor(bigQ: any) {
    this.base = User.find();
    this.bigQ = bigQ;
  }

  search() {
    // modify this if you have more search terms in the search
    const searchword: any = {};
    if (this.bigQ.search) {
      if (this.bigQ.search.name) {
        searchword.name = {
          $regex: this.bigQ.search.name,
          $options: 'i',
        };
      }
      if (this.bigQ.search.role) {
        searchword.role = {
          $regex: this.bigQ.search.role,
          $options: 'i',
        };
      }
    }
    this.base = this.base.find({ ...searchword });
    return this;
  }

  filter() {
    const copyQ = { ...this.bigQ };

    delete copyQ.search;
    delete copyQ.limit;
    delete copyQ.page;
    delete copyQ.populate;

    // convert bigQ into a string => copyQ
    let stringOfCopyQ = JSON.stringify(copyQ);

    // replace key with $key => key = gte => $gte
    stringOfCopyQ = stringOfCopyQ.replace(
      /\b(gte|lte|gt|lt)\b/g,
      (m) => `$${m}`
    );

    const jsonOfCopyQ = JSON.parse(stringOfCopyQ);

    this.base = this.base.find(jsonOfCopyQ);

    return this;
  }

  totalUsers() {
    this.totalcountUser = User.countDocuments();
    return this;
  }

  populate() {
    if (this.bigQ.populate) {
      this.base = this.base.populate(this.bigQ.populate);
    }
    return this;
  }

  pager() {
    let currentPage = 1;
    let limit = 20;
    if (this.bigQ.page) {
      currentPage = parseInt(this.bigQ.page, 10);
    }
    if (this.bigQ.limit) {
      limit = Math.min(this.bigQ.limit, MAX_QUERY_LIMIT);
    }
    const skipVal = limit * (currentPage - 1);

    this.base = this.base.limit(limit).skip(skipVal);

    this.totalPages = Math.round(this.filteredUsersNumber / limit);
    this.page = currentPage;
    this.previousPage = Math.max(1, this.page - 1);
    this.nextPage = Math.min(this.page + 1, this.totalPages);

    return this;
  }

  async exec() {
    this.totalUsers();
    this.search();
    this.filter();
    this.populate();
    let users = await this.base;
    this.filteredUsersNumber = users.length;
    this.pager();
    // https://stackoverflow.com/a/69430142/16580493 for why .clone
    users = await this.base.clone();
    const totalUsersCount = await this.totalcountUser;
    const totalPagesCount = this.totalPages;
    const { previousPage } = this;
    const { page } = this;
    const { nextPage } = this;
    const { filteredUsersNumber } = this;
    return {
      users,
      totalUsersCount,
      totalPagesCount,
      previousPage,
      page,
      nextPage,
      filteredUsersNumber,
    };
  }
}

export { WhereClauseUser };
