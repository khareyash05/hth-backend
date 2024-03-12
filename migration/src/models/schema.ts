import { serial, text, timestamp, pgTable, integer,date } from "drizzle-orm/pg-core";

export const rules = pgTable('rules',{
    id: serial('id').primaryKey(),
    title: text('title'),
    description: text('description')
})

export const problem_statements = pgTable('problem_statements',{
    id: serial('id').primaryKey(),
    title: text('title'),
    description: text('description'),
    category: text('category')
})

export const partners = pgTable('partners',{
    id: serial('id').primaryKey(),
    name: text('name'),
    logo: text('logo'),
    website: text('website')
})

export const prizes = pgTable('prizes',{
    id: serial('id').primaryKey(),
    name: text('name'),
    amount: text('amount'),
})

export const announcements = pgTable('announcements',{
    id: serial('id').primaryKey(),
    title: text('title'),
    description: text('description'),
    time: date("time")
})

export const hackathons = pgTable('hackathons',{
    id : serial("id").primaryKey(),
    name: text("name"),
    description: text("description"),
    start_date: text("start_date"),
    end_date: text("end_date"),
    venue: text("venue"),
    theme: text('theme'),
    imgUrl: text("imgUrl"),
    application_deadline: date("application_deadline"),
    application_open: date("application_open"),
    min_team_size: integer("min_team_size"),
    max_team_size: integer("max_team_size"),
    rules_id: integer('rules_id').references(()=> rules.id).array(),
    problem_statement_id : integer('problem_statement_id').references(()=>problem_statements.id).array(),
    partners_id: integer('partners_id').references(() => partners.id).array(),
    prizes_id: integer('prizes_id').references(()=>prizes.id).array(),
    announcements_id: integer('announcements_id').references(()=> announcements.id).array(),
    admin_id :integer('admin_id').references(()=> users.id),
    judges_id :integer('judges_id').references(()=> users.id).array(),
    teams_id: integer('teams_id').references(()=>teams.id).array(),
    winners: integer('winners_id').references(()=>teams.id).array()
})      

export const submissions = pgTable('submissions',{
    id: serial("id").primaryKey(),
    title:text("title"),
    descriptions: text("descriptions"),
    links: text("links").array()
})

export const reviews = pgTable('reviews',{
    id:serial("id").primaryKey(),
    judge_id: integer('judge_id').references(()=>users.id),
    review:text("review"),
    score: text("score")
})
export const teams = pgTable('teams',{
    id:serial("id").primaryKey(),
    name:text("name"),
    members_id: integer("members_id").references(()=> users.id).array(),
    hackathon_id: integer("hackathon_id").references(()=> hackathons.id),
    submissions_id : integer("submissions_id").references(()=> submissions.id),
    review_id: integer("review_id").references(()=>reviews.id).array()
})


export const users = pgTable('users',{
    first_name : text("first_name"),
    last_name: text("last_name"),
    email: text("email"),
    password: text("password"),
    token: text("token"),
    hackathonsOrganized_id: integer("hackathonsOrganized_id").array().references(()=>hackathons.id),
    hackathonsParticipated_id: integer("hackathonsParticipated_id").array().references(()=>hackathons.id),
    hackathonsJudged_id: integer("hackathonsJudged_id").array().references(()=>hackathons.id),
    teams_id: integer("teams_id").array().references(()=>teams.id)
})
