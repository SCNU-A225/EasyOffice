drop database if exists easyoffice;

create database easyoffice;
use easyoffice;

/*==============================================================*/
/* Table: claim_voucher   报销单                                */
/*==============================================================*/
create table claim_voucher
(
   id                   int not null auto_increment,
   cause                varchar(100),
   create_sn            char(5),
   create_time          datetime,
   next_deal_sn         char(5),
   total_amount         double,
   status               varchar(20),
   primary key (id)
)ENGINE=InnoDB DEFAULT CHARSET=utf8;

set names utf8;

/*==============================================================*/
/* Table: claim_voucher_item   报销单明细                       */
/*==============================================================*/
create table claim_voucher_item
(
   id                   int not null auto_increment,
   claim_voucher_id     int,
   item                 varchar(20),
   amount               double,
   comment              varchar(100),
   primary key (id)
)ENGINE=InnoDB DEFAULT CHARSET=utf8;

/*==============================================================*/
/* Table: deal_record    处理记录                               */
/*==============================================================*/
create table deal_record
(
   id                   int not null auto_increment,
   claim_voucher_id     int,
   deal_sn              char(5),
   deal_time            datetime,
   deal_way             varchar(20),
   deal_result          varchar(20),
   comment              varchar(100),
   primary key (id)
)ENGINE=InnoDB DEFAULT CHARSET=utf8;

/*==============================================================*/
/* Table: department   部门                                     */
/*==============================================================*/
create table department
(
   sn                   char(5) not null,
   name                 varchar(20),
   address              varchar(100),
   primary key (sn)
)ENGINE=InnoDB DEFAULT CHARSET=utf8;

/*==============================================================*/
/* Table: employee    员工                                      */
/*==============================================================*/
create table employee
(
   sn                   char(5) not null,
   password             varchar(20),
   name                 varchar(20),
   department_sn        char(5),
   post                 varchar(20),
   primary key (sn)
)ENGINE=InnoDB DEFAULT CHARSET=utf8;

alter table claim_voucher add constraint FK_Reference_2 foreign key (next_deal_sn)
      references employee (sn);

alter table claim_voucher add constraint FK_Reference_3 foreign key (create_sn)
      references employee (sn);

alter table claim_voucher_item add constraint FK_Reference_4 foreign key (claim_voucher_id)
      references claim_voucher (id);

alter table deal_record add constraint FK_Reference_5 foreign key (claim_voucher_id)
      references claim_voucher (id);

alter table deal_record add constraint FK_Reference_6 foreign key (deal_sn)
      references employee (sn);

alter table employee add constraint FK_Reference_1 foreign key (department_sn)
      references department (sn);

insert into department values('00000','管理员','管理员');
insert into department values('10001','总经理办公室','华师大厦A座225');
insert into department values('10002','财务部','华师大厦A座225');
insert into department values('10003','事业部','华师大厦A座225');

insert into employee values('00000','000000','管理员','00000','管理员');
insert into employee values('10001','000000','许子昌','10001','总经理');
insert into employee values('10002','000000','蒋健','10002','财务');
insert into employee values('10003','000000','彭敏轩','10003','部门经理');
insert into employee values('10004','000000','林培艺','10003','员工');
